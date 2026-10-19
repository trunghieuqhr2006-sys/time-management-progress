package com.example.time_management.progress;

import com.example.time_management.task.Task;
import jakarta.persistence.*;

@Entity
@Table(name = "progress")
public class Progress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String status;

    private boolean completed;

    private int percentage;

    @OneToOne
    @JoinColumn(name = "task_id", nullable = false, unique = true)
    private Task task;

    public Progress() {
    }

    public Progress(String status, boolean completed,
                    int percentage, Task task) {
        this.status = status;
        this.completed = completed;
        this.percentage = percentage;
        this.task = task;
    }

    public Long getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public boolean isCompleted() {
        return completed;
    }

    public int getPercentage() {
        return percentage;
    }

    public Task getTask() {
        return task;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public void setPercentage(int percentage) {
        this.percentage = percentage;
    }

    public void setTask(Task task) {
        this.task = task;
    }
}