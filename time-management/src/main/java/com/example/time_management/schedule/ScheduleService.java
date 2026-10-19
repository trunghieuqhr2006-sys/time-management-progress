package com.example.time_management.schedule;

import com.example.time_management.task.Task;
import com.example.time_management.task.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final TaskRepository taskRepository;

    public ScheduleService(
            ScheduleRepository scheduleRepository,
            TaskRepository taskRepository) {
        this.scheduleRepository = scheduleRepository;
        this.taskRepository = taskRepository;
    }

    public Schedule createSchedule(Schedule schedule) {

        if (schedule.getTask() == null ||
                schedule.getTask().getId() == null) {
            throw new RuntimeException("Schedule phải có task");
        }

        Long taskId = schedule.getTask().getId();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy task"));

        schedule.setTask(task);

        if (schedule.getDate() == null) {
            schedule.setDate(task.getDate());
        }

        return scheduleRepository.save(schedule);
    }

    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    public Schedule getScheduleById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy schedule"));
    }

    public List<Schedule> getSchedulesByDate(LocalDate date) {
        return scheduleRepository.findByDate(date);
    }

    public List<Schedule> getSchedulesByMonth(
            int year,
            int month) {

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(
                startDate.lengthOfMonth()
        );

        return scheduleRepository.findByDateBetween(
                startDate,
                endDate
        );
    }

    public Schedule updateSchedule(
            Long id,
            Schedule newSchedule) {

        Schedule schedule = getScheduleById(id);

        if (newSchedule.getDate() != null) {
            schedule.setDate(newSchedule.getDate());
        }

        if (newSchedule.getTask() != null &&
                newSchedule.getTask().getId() != null) {

            Long taskId = newSchedule.getTask().getId();

            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Không tìm thấy task"));

            schedule.setTask(task);
        }

        return scheduleRepository.save(schedule);
    }

    public void deleteSchedule(Long id) {
        Schedule schedule = getScheduleById(id);
        scheduleRepository.delete(schedule);
    }
}