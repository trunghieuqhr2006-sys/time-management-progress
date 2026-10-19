package com.example.time_management.reminder;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @PostMapping
    public Reminder createReminder(
            @RequestBody Reminder reminder) {

        return reminderService.createReminder(reminder);
    }

    @GetMapping
    public List<Reminder> getAllReminders() {
        return reminderService.getAllReminders();
    }

    @GetMapping("/{id}")
    public Reminder getReminderById(
            @PathVariable Long id) {

        return reminderService.getReminderById(id);
    }

    @GetMapping("/task/{taskId}")
    public List<Reminder> getRemindersByTask(
            @PathVariable Long taskId) {

        return reminderService.getRemindersByTask(taskId);
    }

    @PutMapping("/{id}")
    public Reminder updateReminder(
            @PathVariable Long id,
            @RequestBody Reminder reminder) {

        return reminderService.updateReminder(id, reminder);
    }

    @PutMapping("/{id}/cancel")
    public void cancelReminder(
            @PathVariable Long id) {

        reminderService.cancelReminder(id);
    }

    @DeleteMapping("/{id}")
    public void deleteReminder(
            @PathVariable Long id) {

        reminderService.deleteReminder(id);
    }
}