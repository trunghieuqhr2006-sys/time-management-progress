package com.example.time_management.schedule;

import com.example.time_management.task.Task;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "schedules")
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    @OneToOne
    @JoinColumn(name = "task_id", nullable = false, unique = true)
    private Task task;

    public Schedule() {
    }

    public Schedule(LocalDate date, Task task) {
        this.date = date;
        this.task = task;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getDate() {
        return date;
    }

    public Task getTask() {
        return task;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public void setTask(Task task) {
        this.task = task;
    }
}