# University Question Bank Server API Documentation

## Table of Contents
1. [Installation](#installation)
2. [Environment Setup](#environment-setup)
3. [API Endpoints](#api-endpoints)
4. [Data Structures](#data-structures)
5. [Testing Examples](#testing-examples)

## Installation
```bash
cd server
npm install
```

## Environment Setup
Create `.env` file in server directory:
```env
PORT=3000
```

## API Endpoints

### Branch Management
**Create Branch**
```
POST /api/branches
Body: { name: string, description?: string }
Success: 201 Created
Errors: 400 (Missing name), 500 (Save failed)

GET /api/branches
Returns: Branch[]

GET /api/branches/:branchId
Returns: Branch | 404

DELETE /api/branches/:branchId
Success: 204 No Content
Errors: 404 (Not found), 500
```

### Semester Management
**Create Semester**
```
POST /api/branches/:branchId/semesters
Body: { number: number }
Success: 201 Created
Errors: 400 (Missing number), 404 (Branch not found), 500

GET /api/branches/:branchId/semesters
Returns: Semester[]

DELETE /api/branches/:branchId/semesters/:semesterId
Success: 204
Errors: 404 (Branch/Semester not found), 500
```

### Subject Management
**Create Subject**
```
POST /api/branches/:branchId/semesters/:semesterId/subjects
Body: { name: string, code: string }
Success: 201
Errors: 400 (Missing name/code), 404 (Branch/Semester not found), 500

GET /api/branches/:branchId/semesters/:semesterId/subjects
Returns: Subject[]

DELETE /api/branches/:branchId/semesters/:semesterId/subjects/:subjectId
Success: 204
Errors: 404 (Branch/Semester/Subject not found), 500
```

### Question Management
**Add Question**
```
POST /api/branches/:branchId/semesters/:semesterId/subjects/:subjectId/questions
Body: { 
  text: string,
  type: 'theory'|'numerical',
  year?: number,
  qNumber?: string,
  chapter?: string,
  marks?: number
}
Success: 201
Errors: 400 (Missing text/type or duplicate), 404, 500

GET /api/branches/:branchId/semesters/:semesterId/subjects/:subjectId/questions
Returns: Question[]

DELETE /api/.../questions/:questionId
Success: 204
Errors: 404 (Any parent not found), 500
```

## Data Structures

```json
{
  "branches": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "semesters": [
        {
          "id": "string",
          "number": "number",
          "subjects": [
            {
              "id": "string",
              "name": "string",
              "code": "string",
              "questions": [
                {
                  "questionId": "string",
                  "text": "string",
                  "type": "theory|numerical",
                  "year": "number",
                  "marks": "number"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Testing Examples

Start server:
```bash
npm start
```

Create branch:
```bash
curl -X POST -H "Content-Type: application/json" -d '
{
  "name": "Computer Science",
  "description": "CS Department"
}' http://localhost:3000/api/branches
```

Add question:
```bash
curl -X POST -H "Content-Type: application/json" -d '
{
  "text": "Explain OSI model",
  "type": "theory",
  "marks": 10
}' http://localhost:3000/api/branches/{branchId}/semesters/{semesterId}/subjects/{subjectId}/questions
```

## Data Persistence
- Data automatically saves to `data.json`
- Manual edits to `data.json` require server restart