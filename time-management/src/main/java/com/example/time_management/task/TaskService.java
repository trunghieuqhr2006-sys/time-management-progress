package com.example.time_management.task;

import com.example.time_management.category.Category;
import com.example.time_management.category.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;

    public TaskService(
            TaskRepository taskRepository,
            CategoryRepository categoryRepository) {
        this.taskRepository = taskRepository;
        this.categoryRepository = categoryRepository;
    }

    public Task createTask(Task task) {
        setCategory(task);
        return taskRepository.save(task);
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy task"));
    }

    public Task updateTask(Long id, Task newTask) {
        Task task = getTaskById(id);

        task.setTitle(newTask.getTitle());
        task.setDescription(newTask.getDescription());
        task.setDate(newTask.getDate());
        task.setTime(newTask.getTime());

        if (newTask.getCategory() != null) {
            Long categoryId = newTask.getCategory().getId();

            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() ->
                            new RuntimeException("Không tìm thấy category"));

            task.setCategory(category);
        } else {
            task.setCategory(null);
        }

        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        Task task = getTaskById(id);
        taskRepository.delete(task);
    }

    private void setCategory(Task task) {
        if (task.getCategory() != null &&
                task.getCategory().getId() != null) {

            Long categoryId = task.getCategory().getId();

            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() ->
                            new RuntimeException("Không tìm thấy category"));

            task.setCategory(category);
        }
    }
}