package com.example.time_management.progress;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping
    public Progress createProgress(@RequestBody Progress progress) {
        return progressService.createProgress(progress);
    }

    @GetMapping
    public List<Progress> getAllProgress() {
        return progressService.getAllProgress();
    }

    @GetMapping("/statistics/summary")
    public ProgressStatistics getStatistics() {
        return progressService.getStatistics();
    }

    @GetMapping("/statistics/total")
    public long countAll() {
        return progressService.countAll();
    }

    @GetMapping("/statistics/completed")
    public long countCompleted() {
        return progressService.countCompleted();
    }

    @GetMapping("/statistics/incomplete")
    public long countIncomplete() {
        return progressService.countIncomplete();
    }

    @GetMapping("/task/{taskId}")
    public Progress getProgressByTask(@PathVariable Long taskId) {
        return progressService.getProgressByTask(taskId);
    }

    @GetMapping("/{id}")
    public Progress getProgressById(@PathVariable Long id) {
        return progressService.getProgressById(id);
    }

    @PutMapping("/{id}")
    public Progress updateProgress(@PathVariable Long id, @RequestBody Progress progress) {
        return progressService.updateProgress(id, progress);
    }

    @PutMapping("/{id}/complete")
    public Progress completeTask(@PathVariable Long id) {
        return progressService.completeTask(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProgress(@PathVariable Long id) {
        progressService.deleteProgress(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}
