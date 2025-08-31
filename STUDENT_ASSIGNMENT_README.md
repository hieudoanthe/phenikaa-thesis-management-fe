# Student Assignment Service

## Overview

The Student Assignment Service is a new service that integrates with the thesis-service and profile-service to manage student assignments to defense sessions. It replaces the previous mock data implementation with real API calls.

## Features

### 1. Real Data Integration

- **Approved Registrations**: Fetches students who have successfully registered for topics through the thesis-service
- **Suggested Topics**: Fetches students who have suggested topics that were approved
- **Student Profiles**: Retrieves detailed student information from the profile-service

### 2. Student Management

- **Available Students**: Shows all students eligible for assignment to defense sessions
- **Assigned Students**: Tracks students already assigned to specific defense sessions
- **Assignment Operations**: Assign and unassign students to/from defense sessions

### 3. Registration Type Display

- **Visual Indicators**: Different colors and labels for "Đăng ký đề tài" vs "Đề xuất đề tài"
- **Green Badge**: Students who registered for existing topics
- **Purple Badge**: Students who suggested and had their topics approved

## API Endpoints Used

### Thesis Service

- `GET /api/thesis-service/registers/approved` - Get approved student registrations
- `GET /api/thesis-service/suggested-topics/approved` - Get approved suggested topics
- `GET /api/thesis-service/registers/period?periodId={id}` - Get registrations by period

### Profile Service

- `GET /api/profile-service/student/get-profile/{userId}` - Get student profile information

### Eval Service (Future Implementation)

- `GET /api/eval-service/admin/sessions/{sessionId}/students` - Get assigned students
- `POST /api/eval-service/admin/sessions/{sessionId}/assign-student/{studentId}` - Assign student
- `DELETE /api/eval-service/admin/sessions/{sessionId}/unassign-student/{studentId}` - Unassign student

## Usage

### 1. Import the Service

```javascript
import studentAssignmentService from "../../services/studentAssignment.service";
```

### 2. Load Available Students

```javascript
const availableStudents = await studentAssignmentService.getAvailableStudents();
```

### 3. Load Assigned Students

```javascript
const assignedStudents = await studentAssignmentService.getAssignedStudents(
  sessionId
);
```

### 4. Assign/Unassign Students

```javascript
// Assign a student
await studentAssignmentService.assignStudent(sessionId, studentId);

// Unassign a student
await studentAssignmentService.unassignStudent(sessionId, studentId);
```

## Data Structure

### Student Object

```javascript
{
  studentId: number,
  studentName: string,
  studentCode: string,
  major: string,
  topicTitle: string,
  topicId: number,
  registrationType: "REGISTERED" | "SUGGESTED",
  registrationId?: number,
  suggestionId?: number,
  defenseOrder?: number // Only for assigned students
}
```

## Error Handling

The service includes comprehensive error handling:

- **API Failures**: Graceful fallback to empty arrays
- **Profile Loading Errors**: Individual student profile failures don't break the entire list
- **User Feedback**: Toast notifications for success/error states
- **Loading States**: Visual feedback during data operations

## Future Enhancements

### 1. Backend API Implementation

- Complete the eval-service endpoints for student assignment
- Add database entities for tracking student-session assignments
- Implement assignment validation and business rules

### 2. Advanced Features

- **Batch Operations**: Assign multiple students at once
- **Assignment Rules**: Validate student eligibility (e.g., topic completion status)
- **Conflict Detection**: Prevent double assignments
- **Audit Trail**: Track assignment history and changes

### 3. Performance Optimizations

- **Caching**: Cache student profiles to reduce API calls
- **Pagination**: Handle large numbers of students efficiently
- **Real-time Updates**: WebSocket integration for live updates

## Integration Points

### 1. Defense Sessions Schedule Component

- **Modal Integration**: Student management integrated into session detail modal
- **Real-time Updates**: State management for assigned/available students
- **User Experience**: Click-to-assign interface with visual feedback

### 2. Thesis Service Integration

- **Registration Data**: Leverages existing student registration system
- **Topic Information**: Displays actual topic titles and details
- **Period Management**: Respects registration period constraints

### 3. Profile Service Integration

- **Student Information**: Real student names, codes, and majors
- **Data Consistency**: Ensures student data is up-to-date
- **Error Resilience**: Continues working even if some profiles fail to load

## Testing

### 1. Mock Data Fallback

- Service gracefully falls back to empty arrays if APIs fail
- UI handles empty states appropriately
- Error messages are user-friendly

### 2. API Integration Testing

- Test with real thesis-service data
- Verify profile-service integration
- Validate error handling scenarios

### 3. UI Testing

- Test assignment/unassignment flows
- Verify loading states and error handling
- Test with various data scenarios (empty, single, multiple students)

## Troubleshooting

### Common Issues

1. **No Students Available**

   - Check if thesis-service is running
   - Verify there are approved registrations/suggestions
   - Check profile-service connectivity

2. **Assignment Failures**

   - Verify session exists and is valid
   - Check student eligibility
   - Review backend API implementation

3. **Profile Loading Errors**
   - Check profile-service connectivity
   - Verify student IDs are valid
   - Review error logs for specific failures

### Debug Information

- Console logs for API calls and responses
- Toast notifications for user feedback
- Loading states for visual feedback
- Error boundaries for graceful failures
