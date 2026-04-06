package com.cursify.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "courses")
public class Course {
    @Id private String id;
    @Indexed(unique = true) private String courseId;
    private String teacherId;
    private String teacherName;
    private String title;
    private String category;
    private String description;
    private String pedagogyDescription;
    private String level;
    private int lessonsCount;
    private int estimatedHours;
    private String thumbnailBase64 = "";
    private int enrolledCount = 0;
    private String createdAt;

    public String getId() { return id; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }
    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPedagogyDescription() { return pedagogyDescription; }
    public void setPedagogyDescription(String pedagogyDescription) { this.pedagogyDescription = pedagogyDescription; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public int getLessonsCount() { return lessonsCount; }
    public void setLessonsCount(int lessonsCount) { this.lessonsCount = lessonsCount; }
    public int getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(int estimatedHours) { this.estimatedHours = estimatedHours; }
    public String getThumbnailBase64() { return thumbnailBase64; }
    public void setThumbnailBase64(String thumbnailBase64) { this.thumbnailBase64 = thumbnailBase64; }
    public int getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(int enrolledCount) { this.enrolledCount = enrolledCount; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
