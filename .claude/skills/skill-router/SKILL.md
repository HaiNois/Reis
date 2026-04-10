# Skill Router - Automatic Skill Selection

## Purpose

This skill acts as a **decision engine** that analyzes user requests and recommends the most appropriate specialized skill or agent to handle the task.

## Available Skills

| Skill/Agent | When to Use |
|-------------|-------------|
| `frontend-react-vite` | React components, pages, Vite/Tailwind/shadcn setup, React debugging, frontend optimization |
| `backend-node-express` | API endpoints, Prisma models, Express middleware, Node.js business logic, database operations |
| `check-code-quality` | Code analysis, bug detection, performance issues, security vulnerabilities, design problems |
| `check-failed-files` | SAP file sync status for Nois.SOAP (FileData directories: DO, SO, PO, STO, DOSTO, POSTOCH, Truck, Vendor) |
| `check-logs` | Log analysis for Nois.SOAP and Nois.Api (Log4Net files, ERROR/EXCEPTION patterns) |
| `check-tasks` | Scheduled task status for Nois.SOAP, Nois.Api, Nois.App |
| `frontend-developer` | Complex frontend architecture decisions, React patterns, team coordination |
| `backend-developer` | Complex backend architecture decisions, API design, team coordination |
| `ux-designer` | UI/UX design, layout decisions, component hierarchy, design system |

## Decision Logic

### Step 1: Analyze Request Type

```
IF request contains:
- "tạo component", "tạo page", "React", "frontend", "Vite", "Tailwind", "shadcn" → frontend-react-vite
- "API", "endpoint", "Prisma", "backend", "database", "model", "middleware" → backend-node-express
- "bug", "lỗi", "performance", "quality", "analyze", "review code" → check-code-quality
- "SAP", "FileData", "sync", "failed", "đồng bộ" → check-failed-files
- "log", "error", "exception", "Log4Net" → check-logs
- "task", "schedule", "scheduled" → check-tasks
- "thiết kế", "design", "UI", "UX", "layout" → ux-designer
- ELSE → default to most relevant based on file context
```

### Step 2: Check File Context

Look at currently open files in IDE:
- `frontend/src/**` → strongly suggest `frontend-react-vite`
- `backend/src/**` → strongly suggest `backend-node-express`
- `.claude/skills/**` → return skill content directly

### Step 3: Output Format

Return one of:

**Option A: Skill Recommendation**
```json
{
  "skill": "frontend-react-vite",
  "reason": "Request involves creating new React component",
  "confidence": "high"
}
```

**Option B: Agent Recommendation**
```json
{
  "agent": "frontend-developer",
  "reason": "Complex frontend architecture decision needed",
  "confidence": "medium"
}
```

**Option C: No Routing Needed**
```json
{
  "route": false,
  "reason": "Request is conversational or out of scope"
}
```

## Usage

This skill is typically invoked by a PreToolUse hook that analyzes user requests before tool execution. It can also be called directly by the user or by other agents when they need to determine the appropriate skill.

## Examples

| User Request | Recommended Skill/Agent |
|--------------|-------------------------|
| "tạo component ProductCard" | `frontend-react-vite` |
| "thêm API endpoint cho orders" | `backend-node-express` |
| "fix bug ở checkout" | `check-code-quality` |
| "kiểm tra file SAP failed" | `check-failed-files` |
| "xem log gần đây" | `check-logs` |
| "trạng thái scheduled tasks" | `check-tasks` |
| "thiết kế layout trang home" | `ux-designer` |