# StudyApp Engineering Rules & Guidelines

These core guidelines apply to all implementation phases of StudyApp:

1. **Clean, Short, and Maintainable Code:**
   - Keep code simple, readable, and modular.
   - Avoid unnecessary files, duplicate code, overengineering, and excessive comments.
   - Use reusable components, utility methods, and clean service layers.

2. **Full-Stack Separation of Concerns:**
   - Keep frontend (React/TypeScript), backend (Spring Boot/Java 17), and database (MySQL/JPA) logic strictly separated.
   - Controllers handle HTTP routing and validation; Services handle business logic; Repositories handle persistence.
   - Frontend services handle API client requests with standard Axios and typed DTOs.

3. **Preservation & Incremental Evolution:**
   - Always inspect existing code before editing.
   - Preserve existing working features and project structures; never rewrite or discard functional code unnecessarily.
   - Fix errors specifically without rewriting unrelated files.

4. **Production Completeness:**
   - Implement features completely: include input validation, graceful error handling, loading states, and database persistence.
   - No mock shortcuts where backend persistence is expected.

5. **Security & Configuration:**
   - Never commit API keys, secrets, or passwords. Keep them strictly in environment variables or local properties.
   - Validate authorization and resource ownership on the server side for every user-scoped endpoint.

6. **Quality & Verification:**
   - Test builds and changes to guarantee the application compiles and runs without regression.
