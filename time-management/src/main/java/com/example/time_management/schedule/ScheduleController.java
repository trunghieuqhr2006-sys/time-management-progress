package com.example.time_management.schedule;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PostMapping
    public Schedule createSchedule(
            @RequestBody Schedule schedule) {

        return scheduleService.createSchedule(schedule);
    }

    @GetMapping
    public List<Schedule> getAllSchedules() {
        return scheduleService.getAllSchedules();
    }

    @GetMapping("/{id}")
    public Schedule getScheduleById(
            @PathVariable Long id) {

        return scheduleService.getScheduleById(id);
    }

    @GetMapping("/date/{date}")
    public List<Schedule> getSchedulesByDate(
            @PathVariable LocalDate date) {

        return scheduleService.getSchedulesByDate(date);
    }

    @GetMapping("/month/{year}/{month}")
    public List<Schedule> getSchedulesByMonth(
            @PathVariable int year,
            @PathVariable int month) {

        return scheduleService.getSchedulesByMonth(
                year,
                month
        );
    }

    @PutMapping("/{id}")
    public Schedule updateSchedule(
            @PathVariable Long id,
            @RequestBody Schedule schedule) {

        return scheduleService.updateSchedule(id, schedule);
    }

    @DeleteMapping("/{id}")
    public void deleteSchedule(
            @PathVariable Long id) {

        scheduleService.deleteSchedule(id);
    }
}