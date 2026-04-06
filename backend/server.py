import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, WebSocket, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="CursiFy API", version="1.0.0")
api_router = APIRouter(prefix="/api")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cursify_dev_secret_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class MessageResponse(BaseModel):
    message: str


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: str
    email: EmailStr
    username: str
    role: Literal["student", "teacher", "admin"]
    bio: str = ""
    profile_image_base64: str = ""
    created_at: str


class RegisterInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=6, max_length=72)
    role: Literal["student", "teacher", "admin"]
    bio: str = Field(default="", max_length=400)
    profile_image_base64: str = ""


class LoginInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class CourseBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=4, max_length=120)
    category: str = Field(min_length=3, max_length=40)
    description: str = Field(min_length=12, max_length=1000)
    pedagogy_description: str = Field(min_length=12, max_length=1000)
    level: Literal["beginner", "intermediate", "advanced"]
    lessons_count: int = Field(ge=1, le=300)
    estimated_hours: int = Field(ge=1, le=500)
    thumbnail_base64: str = ""


class CourseOut(CourseBase):
    course_id: str
    teacher_id: str
    teacher_name: str
    created_at: str
    enrolled_count: int


class EnrollmentOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enrollment_id: str
    course_id: str
    user_id: str
    enrolled_at: str


class EnrolledCourseOut(BaseModel):
    enrollment_id: str
    enrolled_at: str
    course: CourseOut


class UpdateProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=3, max_length=40)
    bio: str = Field(default="", max_length=400)
    profile_image_base64: str = ""


class AdminOverview(BaseModel):
    users_total: int
    students_total: int
    teachers_total: int
    admins_total: int
    courses_total: int
    enrollments_total: int


class CurrentUser(BaseModel):
    user_id: str
    email: EmailStr
    username: str
    role: Literal["student", "teacher", "admin"]
    bio: str = ""
    profile_image_base64: str = ""
    created_at: str


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict[str, str]) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def user_to_public(doc: dict) -> UserPublic:
    return UserPublic(
        user_id=doc["user_id"],
        email=doc["email"],
        username=doc["username"],
        role=doc["role"],
        bio=doc.get("bio", ""),
        profile_image_base64=doc.get("profile_image_base64", ""),
        created_at=doc["created_at"],
    )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise credentials_exception
    return CurrentUser(**user_doc)


def ensure_role(user: CurrentUser, allowed_roles: set[str]) -> None:
    if user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Você não tem permissão para esta ação.")


@api_router.get("/", response_model=MessageResponse)
async def root() -> MessageResponse:
    return MessageResponse(message="CursiFy API online")


@api_router.post("/auth/register", response_model=UserPublic, status_code=201)
async def register_user(payload: RegisterInput) -> UserPublic:
    existing_email = await db.users.find_one({"email": payload.email}, {"_id": 0, "user_id": 1})
    if existing_email:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")

    existing_username = await db.users.find_one({"username": payload.username}, {"_id": 0, "user_id": 1})
    if existing_username:
        raise HTTPException(status_code=409, detail="Username já está em uso.")

    now = utc_now_iso()
    user_doc = {
        "user_id": str(uuid.uuid4()),
        "email": str(payload.email).lower(),
        "username": payload.username.strip(),
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "bio": payload.bio.strip(),
        "profile_image_base64": payload.profile_image_base64,
        "created_at": now,
    }
    await db.users.insert_one(user_doc)
    return user_to_public(user_doc)


@api_router.post("/auth/login", response_model=LoginResponse)
async def login_user(payload: LoginInput) -> LoginResponse:
    user_doc = await db.users.find_one({"email": str(payload.email).lower()}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    if not verify_password(payload.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    access_token = create_access_token(
        data={
            "sub": user_doc["user_id"],
            "role": user_doc["role"],
            "username": user_doc["username"],
        }
    )
    return LoginResponse(access_token=access_token, user=user_to_public(user_doc))


@api_router.get("/auth/me", response_model=UserPublic)
async def read_current_user(current_user: CurrentUser = Depends(get_current_user)) -> UserPublic:
    return UserPublic(**current_user.model_dump())


@api_router.put("/auth/profile", response_model=UserPublic)
async def update_profile(
    payload: UpdateProfileInput,
    current_user: CurrentUser = Depends(get_current_user),
) -> UserPublic:
    if payload.username != current_user.username:
        existing = await db.users.find_one({"username": payload.username}, {"_id": 0, "user_id": 1})
        if existing and existing["user_id"] != current_user.user_id:
            raise HTTPException(status_code=409, detail="Username já está em uso.")

    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "username": payload.username.strip(),
            "bio": payload.bio.strip(),
            "profile_image_base64": payload.profile_image_base64,
        }},
    )
    updated = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "password_hash": 0})
    return user_to_public(updated)


@api_router.delete("/courses/{course_id}", status_code=204)
async def delete_course(
    course_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    ensure_role(current_user, {"teacher", "admin"})
    query = {"course_id": course_id}
    if current_user.role == "teacher":
        query["teacher_id"] = current_user.user_id
    result = await db.courses.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Curso não encontrado ou sem permissão.")
    await db.enrollments.delete_many({"course_id": course_id})


@api_router.get("/courses", response_model=list[CourseOut])
async def list_courses(category: Optional[str] = Query(default=None, min_length=2, max_length=40)) -> list[CourseOut]:
    query = {"category": category} if category else {}
    course_docs = (
        await db.courses.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=1000)
    )
    return [CourseOut(**course) for course in course_docs]


@api_router.post("/courses", response_model=CourseOut, status_code=201)
async def create_course(
    payload: CourseBase,
    current_user: CurrentUser = Depends(get_current_user),
) -> CourseOut:
    ensure_role(current_user, {"teacher", "admin"})
    now = utc_now_iso()
    course_doc = {
        "course_id": str(uuid.uuid4()),
        "teacher_id": current_user.user_id,
        "teacher_name": current_user.username,
        "title": payload.title.strip(),
        "category": payload.category.strip(),
        "description": payload.description.strip(),
        "pedagogy_description": payload.pedagogy_description.strip(),
        "level": payload.level,
        "lessons_count": payload.lessons_count,
        "estimated_hours": payload.estimated_hours,
        "thumbnail_base64": payload.thumbnail_base64,
        "enrolled_count": 0,
        "created_at": now,
    }
    await db.courses.insert_one(course_doc.copy())
    return CourseOut(**course_doc)


@api_router.get("/courses/{course_id}", response_model=CourseOut)
async def get_course_details(course_id: str) -> CourseOut:
    course_doc = await db.courses.find_one({"course_id": course_id}, {"_id": 0})
    if not course_doc:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    return CourseOut(**course_doc)


@api_router.post("/courses/{course_id}/enroll", response_model=EnrollmentOut, status_code=201)
async def enroll_in_course(
    course_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> EnrollmentOut:
    ensure_role(current_user, {"student", "admin"})

    course_exists = await db.courses.find_one({"course_id": course_id}, {"_id": 0, "course_id": 1})
    if not course_exists:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    existing_enrollment = await db.enrollments.find_one(
        {"course_id": course_id, "user_id": current_user.user_id},
        {"_id": 0, "enrollment_id": 1},
    )
    if existing_enrollment:
        raise HTTPException(status_code=409, detail="Você já está inscrito neste curso.")

    enrollment_doc = {
        "enrollment_id": str(uuid.uuid4()),
        "course_id": course_id,
        "user_id": current_user.user_id,
        "enrolled_at": utc_now_iso(),
    }
    await db.enrollments.insert_one(enrollment_doc.copy())
    await db.courses.update_one({"course_id": course_id}, {"$inc": {"enrolled_count": 1}})
    return EnrollmentOut(**enrollment_doc)


@api_router.get("/enrollments/me", response_model=list[EnrolledCourseOut])
async def my_enrollments(current_user: CurrentUser = Depends(get_current_user)) -> list[EnrolledCourseOut]:
    enrollment_docs = await db.enrollments.find(
        {"user_id": current_user.user_id},
        {"_id": 0},
    ).to_list(length=1000)
    if not enrollment_docs:
        return []

    course_ids = [enrollment["course_id"] for enrollment in enrollment_docs]
    course_docs = await db.courses.find({"course_id": {"$in": course_ids}}, {"_id": 0}).to_list(length=1000)
    course_map = {course["course_id"]: CourseOut(**course) for course in course_docs}

    output: list[EnrolledCourseOut] = []
    for enrollment in enrollment_docs:
        course = course_map.get(enrollment["course_id"])
        if course:
            output.append(
                EnrolledCourseOut(
                    enrollment_id=enrollment["enrollment_id"],
                    enrolled_at=enrollment["enrolled_at"],
                    course=course,
                )
            )
    return output


@api_router.get("/professor/courses", response_model=list[CourseOut])
async def professor_courses(current_user: CurrentUser = Depends(get_current_user)) -> list[CourseOut]:
    ensure_role(current_user, {"teacher", "admin"})
    query = {} if current_user.role == "admin" else {"teacher_id": current_user.user_id}
    course_docs = await db.courses.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=1000)
    return [CourseOut(**course) for course in course_docs]


@api_router.get("/admin/overview", response_model=AdminOverview)
async def admin_overview(current_user: CurrentUser = Depends(get_current_user)) -> AdminOverview:
    ensure_role(current_user, {"admin"})
    users_total = await db.users.count_documents({})
    students_total = await db.users.count_documents({"role": "student"})
    teachers_total = await db.users.count_documents({"role": "teacher"})
    admins_total = await db.users.count_documents({"role": "admin"})
    courses_total = await db.courses.count_documents({})
    enrollments_total = await db.enrollments.count_documents({})
    return AdminOverview(
        users_total=users_total,
        students_total=students_total,
        teachers_total=teachers_total,
        admins_total=admins_total,
        courses_total=courses_total,
        enrollments_total=enrollments_total,
    )


@app.websocket("/api/ws/chat/{room_id}")
async def chat_websocket(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            await websocket.send_text(f"[{room_id}] {message}")
    except Exception:
        await websocket.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event() -> None:
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.courses.create_index("course_id", unique=True)
    await db.enrollments.create_index([("course_id", 1), ("user_id", 1)], unique=True)
    logger.info("Índices principais inicializados")


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
