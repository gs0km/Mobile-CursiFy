import uuid

import pytest


def _user_payload(role: str, suffix: str) -> dict:
    return {
        "email": f"test_{role}_{suffix}@example.com",
        "username": f"TEST_{role}_{suffix}",
        "password": "testpass123",
        "role": role,
        "bio": f"TEST bio for {role}",
        "profile_image_base64": "",
    }


@pytest.fixture(scope="module")
def seeded_users(api_client, base_url):
    # Auth and role test users used across API integration tests
    suffix = str(uuid.uuid4())[:8]
    users = {
        "student": _user_payload("student", suffix),
        "teacher": _user_payload("teacher", suffix),
        "admin": _user_payload("admin", suffix),
    }

    for payload in users.values():
        response = api_client.post(f"{base_url}/api/auth/register", json=payload)
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["email"] == payload["email"].lower()
        assert body["role"] == payload["role"]
        assert "_id" not in body

    return users


@pytest.fixture(scope="module")
def tokens(api_client, base_url, seeded_users):
    # JWT login fixtures for role-based endpoint access validation
    out = {}
    for role, payload in seeded_users.items():
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": payload["email"], "password": payload["password"]},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert isinstance(body.get("access_token"), str) and body["access_token"]
        assert body.get("token_type") == "bearer"
        assert body["user"]["role"] == role
        out[role] = body["access_token"]
    return out


@pytest.fixture(scope="module")
def teacher_course(api_client, base_url, tokens):
    # Teacher-owned course used for enrollment and detail flows
    suffix = str(uuid.uuid4())[:8]
    payload = {
        "title": f"TEST React Native {suffix}",
        "category": "Mobile",
        "description": "Curso de testes de integração mobile com Expo.",
        "pedagogy_description": "Aulas práticas e curtas com exercícios guiados.",
        "level": "beginner",
        "lessons_count": 8,
        "estimated_hours": 5,
        "thumbnail_base64": "",
    }
    response = api_client.post(
        f"{base_url}/api/courses",
        json=payload,
        headers={"Authorization": f"Bearer {tokens['teacher']}"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["title"] == payload["title"]
    assert body["enrolled_count"] == 0
    return body


def test_api_root_health(api_client, base_url):
    # API base health endpoint
    response = api_client.get(f"{base_url}/api/")
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "CursiFy API online"


def test_login_returns_jwt_for_student(api_client, base_url, seeded_users):
    # Login JWT contract validation for student role
    student = seeded_users["student"]
    response = api_client.post(
        f"{base_url}/api/auth/login",
        json={"email": student["email"], "password": student["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body.get("access_token"), str) and len(body["access_token"]) > 20


def test_courses_public_listing(api_client, base_url, teacher_course):
    # Public catalog listing and create->get persistence check
    response = api_client.get(f"{base_url}/api/courses")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    match = next((course for course in body if course["course_id"] == teacher_course["course_id"]), None)
    assert match is not None
    assert match["title"] == teacher_course["title"]


def test_student_cannot_create_course(api_client, base_url, tokens):
    # Role guard: student cannot create courses
    payload = {
        "title": "TEST forbidden create",
        "category": "Mobile",
        "description": "Descrição suficiente para validar bloqueio do endpoint.",
        "pedagogy_description": "Descrição pedagógica suficiente para validar bloqueio.",
        "level": "beginner",
        "lessons_count": 3,
        "estimated_hours": 2,
        "thumbnail_base64": "",
    }
    response = api_client.post(
        f"{base_url}/api/courses",
        json=payload,
        headers={"Authorization": f"Bearer {tokens['student']}"},
    )
    assert response.status_code == 403
    assert "permissão" in response.json()["detail"].lower()


def test_admin_can_create_course(api_client, base_url, tokens):
    # Role guard: admin can create courses
    suffix = str(uuid.uuid4())[:8]
    payload = {
        "title": f"TEST Admin Course {suffix}",
        "category": "Gestão",
        "description": "Curso administrativo para validar criação por perfil admin.",
        "pedagogy_description": "Metodologia orientada por indicadores e governança.",
        "level": "intermediate",
        "lessons_count": 6,
        "estimated_hours": 4,
        "thumbnail_base64": "",
    }
    response = api_client.post(
        f"{base_url}/api/courses",
        json=payload,
        headers={"Authorization": f"Bearer {tokens['admin']}"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == payload["title"]


def test_student_can_enroll_and_get_nested_course(api_client, base_url, tokens, teacher_course):
    # Enrollment + /enrollments/me nested course object contract
    enroll_response = api_client.post(
        f"{base_url}/api/courses/{teacher_course['course_id']}/enroll",
        headers={"Authorization": f"Bearer {tokens['student']}"},
    )
    assert enroll_response.status_code == 201, enroll_response.text
    enroll_body = enroll_response.json()
    assert enroll_body["course_id"] == teacher_course["course_id"]

    me_response = api_client.get(
        f"{base_url}/api/enrollments/me",
        headers={"Authorization": f"Bearer {tokens['student']}"},
    )
    assert me_response.status_code == 200
    me_body = me_response.json()
    assert isinstance(me_body, list)
    match = next(
        (item for item in me_body if item["course"]["course_id"] == teacher_course["course_id"]),
        None,
    )
    assert match is not None
    assert match["course"]["title"] == teacher_course["title"]


def test_admin_can_enroll_and_get_nested_course(api_client, base_url, tokens, teacher_course):
    # Admin enrollment access and nested enrollment retrieval
    enroll_response = api_client.post(
        f"{base_url}/api/courses/{teacher_course['course_id']}/enroll",
        headers={"Authorization": f"Bearer {tokens['admin']}"},
    )
    assert enroll_response.status_code == 201, enroll_response.text
    enroll_body = enroll_response.json()
    assert enroll_body["course_id"] == teacher_course["course_id"]

    me_response = api_client.get(
        f"{base_url}/api/enrollments/me",
        headers={"Authorization": f"Bearer {tokens['admin']}"},
    )
    assert me_response.status_code == 200
    me_body = me_response.json()
    assert isinstance(me_body, list)
    match = next(
        (item for item in me_body if item["course"]["course_id"] == teacher_course["course_id"]),
        None,
    )
    assert match is not None
    assert match["course"]["title"] == teacher_course["title"]


def test_admin_overview_access_control(api_client, base_url, tokens):
    # Admin-only endpoint role restrictions
    teacher_resp = api_client.get(
        f"{base_url}/api/admin/overview",
        headers={"Authorization": f"Bearer {tokens['teacher']}"},
    )
    assert teacher_resp.status_code == 403

    admin_resp = api_client.get(
        f"{base_url}/api/admin/overview",
        headers={"Authorization": f"Bearer {tokens['admin']}"},
    )
    assert admin_resp.status_code == 200
    body = admin_resp.json()
    assert body["users_total"] >= 3
    assert body["courses_total"] >= 1
