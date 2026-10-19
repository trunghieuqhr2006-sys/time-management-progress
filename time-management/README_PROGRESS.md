# Time Management — Backend Progress

This repository includes the Progress backend for the task/calendar management project.

## Progress features

- Create and retrieve task progress records.
- Update status (`TODO`, `IN_PROGRESS`, `COMPLETED`).
- Mark a task complete; completion sets `completed=true` and `percentage=100`.
- Validate progress percentage (0–100).
- Avoid creating a second progress record for the same task.
- Provide task counts and a summary completion rate.

## API endpoints

Base URL: `/api/progress`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/progress` | List progress records |
| POST | `/api/progress` | Create progress for a task |
| GET | `/api/progress/{id}` | Get progress by ID |
| GET | `/api/progress/task/{taskId}` | Get progress by task ID |
| PUT | `/api/progress/{id}` | Update status and percentage |
| PUT | `/api/progress/{id}/complete` | Mark complete |
| DELETE | `/api/progress/{id}` | Delete progress |
| GET | `/api/progress/statistics/total` | Count all tasks |
| GET | `/api/progress/statistics/completed` | Count completed tasks |
| GET | `/api/progress/statistics/incomplete` | Count incomplete tasks |
| GET | `/api/progress/statistics/summary` | Get all counts and completion rate |

### Example: create progress

`POST /api/progress`

```json
{
  "status": "IN_PROGRESS",
  "completed": false,
  "percentage": 40,
  "task": { "id": 1 }
}
```

The referenced task must already exist and must not already have a progress record.

### Example: statistics summary

`GET /api/progress/statistics/summary`

```json
{
  "totalTasks": 10,
  "completedTasks": 4,
  "incompleteTasks": 6,
  "completionRate": 40.0
}
```

Values above are examples only. Actual values depend on the database.

## Run locally

Requirements: Java 21, Maven, and MySQL. Create a database named `time_management`.

Configure connection details with environment variables rather than committing credentials:

- `DB_URL` (optional; defaults to local MySQL `time_management`)
- `DB_USERNAME` (optional; defaults to `root`)
- `DB_PASSWORD` (set this to your local MySQL password)

PowerShell example:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-password"
mvn spring-boot:run
```

## Important

The Progress code was prepared from the supplied project source, but could not be built in this environment because Maven is not installed. Run `mvn test` or `mvn spring-boot:run` locally before submitting it to your team. Never commit a real database password.
