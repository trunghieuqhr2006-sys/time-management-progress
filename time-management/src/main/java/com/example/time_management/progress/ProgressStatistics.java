package com.example.time_management.progress;

/** Summary statistics returned by the Progress API. */
public record ProgressStatistics(
        long totalTasks,
        long completedTasks,
        long incompleteTasks,
        double completionRate
) {
}
