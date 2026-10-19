package com.example.time_management.progress;

import com.example.time_management.task.Task;
import com.example.time_management.task.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProgressService {

    private final ProgressRepository progressRepository;
    private final TaskRepository taskRepository;

    public ProgressService(ProgressRepository progressRepository, TaskRepository taskRepository) {
        this.progressRepository = progressRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional
    public Progress createProgress(Progress progress) {
        if (progress == null || progress.getTask() == null || progress.getTask().getId() == null) {
            throw new IllegalArgumentException("Progress phải có task hợp lệ");
        }

        Long taskId = progress.getTask().getId();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task có ID: " + taskId));

        if (progressRepository.existsByTaskId(taskId)) {
            throw new IllegalArgumentException("Task này đã có bản ghi progress");
        }

        progress.setTask(task);
        normalizeProgress(progress);
        return progressRepository.save(progress);
    }

    public List<Progress> getAllProgress() {
        return progressRepository.findAll();
    }

    public Progress getProgressById(Long id) {
        return progressRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy progress có ID: " + id));
    }

    public Progress getProgressByTask(Long taskId) {
        return progressRepository.findByTaskId(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task chưa có progress"));
    }

    @Transactional
    public Progress updateProgress(Long id, Progress newProgress) {
        if (newProgress == null) {
            throw new IllegalArgumentException("Dữ liệu progress không được để trống");
        }

        Progress progress = getProgressById(id);
        progress.setStatus(newProgress.getStatus());
        progress.setCompleted(newProgress.isCompleted());
        progress.setPercentage(newProgress.getPercentage());
        normalizeProgress(progress);
        return progressRepository.save(progress);
    }

    @Transactional
    public Progress completeTask(Long id) {
        Progress progress = getProgressById(id);
        progress.setStatus("COMPLETED");
        progress.setCompleted(true);
        progress.setPercentage(100);
        return progressRepository.save(progress);
    }

    @Transactional
    public void deleteProgress(Long id) {
        progressRepository.delete(getProgressById(id));
    }

    // Total counts tasks, including tasks that do not yet have a progress row.
    public long countAll() {
        return taskRepository.count();
    }

    public long countCompleted() {
        return progressRepository.countByCompletedTrue();
    }

    public long countIncomplete() {
        return Math.max(0L, taskRepository.count() - progressRepository.countByCompletedTrue());
    }

    public ProgressStatistics getStatistics() {
        long total = countAll();
        long completed = countCompleted();
        long incomplete = Math.max(0L, total - completed);
        double rate = total == 0 ? 0.0 : Math.round((completed * 10000.0) / total) / 100.0;
        return new ProgressStatistics(total, completed, incomplete, rate);
    }

    private void normalizeProgress(Progress progress) {
        int percentage = progress.getPercentage();
        if (percentage < 0 || percentage > 100) {
            throw new IllegalArgumentException("Tiến độ phải nằm trong khoảng 0 đến 100");
        }

        String status = progress.getStatus();
        if (status != null && !status.isBlank()
                && !status.equals("TODO")
                && !status.equals("IN_PROGRESS")
                && !status.equals("COMPLETED")) {
            throw new IllegalArgumentException(
                    "Trạng thái không hợp lệ. Chỉ chấp nhận TODO, IN_PROGRESS hoặc COMPLETED");
        }

        if (progress.isCompleted() || "COMPLETED".equals(status) || percentage == 100) {
            progress.setStatus("COMPLETED");
            progress.setCompleted(true);
            progress.setPercentage(100);
        } else if ("TODO".equals(status)) {
            progress.setStatus("TODO");
            progress.setCompleted(false);
            progress.setPercentage(0);
        } else if ("IN_PROGRESS".equals(status) || percentage > 0) {
            progress.setStatus("IN_PROGRESS");
            progress.setCompleted(false);
        } else {
            progress.setStatus("TODO");
            progress.setCompleted(false);
            progress.setPercentage(0);
        }
    }
}
