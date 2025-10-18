# API Endpoint Test

## Issue Fixed

The real-time validation was failing with a `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` error.

## Root Cause

The frontend was calling the wrong API endpoint:

- **Incorrect**: `/api/eval-service/teacher/evaluator/${teacherId}/sessions`
- **Correct**: `/api/eval-service/teacher/schedule/evaluator/${teacherId}/sessions`

The missing `/schedule` part in the URL path was causing the request to hit a non-existent endpoint, which returned an HTML error page instead of JSON.

## Backend Controller Structure

```java
@RestController
@RequestMapping("/api/eval-service/teacher/schedule")  // Base path
public class TeacherScheduleController {

    @GetMapping("/evaluator/{evaluatorId}/sessions")  // Endpoint path
    public ResponseEntity<List<Map<String, Object>>> getSessionsByLecturer(@PathVariable Integer evaluatorId) {
        // Implementation...
    }
}
```

## Full Correct Endpoint

`/api/eval-service/teacher/schedule/evaluator/{teacherId}/sessions`

## Testing

To test if the fix works:

1. Open the Defense Sessions Management page
2. Click "Tạo phiên bảo vệ mới"
3. Select a date and time
4. Try to select committee members or reviewers
5. The system should now properly check for schedule conflicts without the JSON parsing error

## Expected Behavior

- No more `SyntaxError` in console
- Real-time validation should work properly
- Teachers with schedule conflicts should be disabled in the dropdown
- Visual feedback should show which teachers are busy
