package com.example.time_management.reminder;

import com.example.time_management.task.Task;
import com.example.time_management.task.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final TaskRepository taskRepository;

    public ReminderService(
            ReminderRepository reminderRepository,
            TaskRepository taskRepository) {
        this.reminderRepository = reminderRepository;
        this.taskRepository = taskRepository;
    }

    public Reminder createReminder(Reminder reminder) {

        if (reminder.getTask() == null ||
                reminder.getTask().getId() == null) {
            throw new RuntimeException("Reminder phải có task");
        }

        Long taskId = reminder.getTask().getId();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy task"));

        reminder.setTask(task);

        return reminderRepository.save(reminder);
    }

    public List<Reminder> getAllReminders() {
        return reminderRepository.findAll();
    }

    public List<Reminder> getRemindersByTask(Long taskId) {
        return reminderRepository.findByTaskId(taskId);
    }

    public Reminder getReminderById(Long id) {
        return reminderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy reminder"));
    }

    public Reminder updateReminder(Long id, Reminder newReminder) {

        Reminder reminder = getReminderById(id);

        reminder.setReminderTime(newReminder.getReminderTime());
        reminder.setEnabled(newReminder.isEnabled());

        if (newReminder.getTask() != null &&
                newReminder.getTask().getId() != null) {

            Long taskId = newReminder.getTask().getId();

            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() ->
                            new RuntimeException("Không tìm thấy task"));

            reminder.setTask(task);
        }

        return reminderRepository.save(reminder);
    }

    public void cancelReminder(Long id) {

        Reminder reminder = getReminderById(id);

        reminder.setEnabled(false);

        reminderRepository.save(reminder);
    }

    public void deleteReminder(Long id) {
        Reminder reminder = getReminderById(id);
        reminderRepository.delete(reminder);
    }
}