# Claude Code Agents for Training Simulator

This directory contains specialized Claude Code agents designed to assist with different aspects of developing the Training Simulator application.

## Available Agents

### Core Development Agents

#### 1. Database Admin (`/db-admin`)
**Purpose**: Manage database schema migrations, optimize queries, review data modeling, ensure proper indexing, and monitor database health and security.

**Use when**:
- Creating or reviewing database migrations
- Analyzing query performance
- Reviewing RLS policies
- Troubleshooting database issues
- Planning schema changes

**Example usage**:
```
/db-admin
Create a migration to add a notifications table with user preferences
```

#### 2. Frontend Developer (`/frontend-dev`)
**Purpose**: Build React components, implement UI features, manage state, integrate APIs, and follow established frontend patterns.

**Use when**:
- Creating new React components
- Implementing UI features
- Refactoring frontend code
- Integrating with Supabase
- Implementing forms and validation

**Example usage**:
```
/frontend-dev
Create a reusable SearchBar component with debouncing
```

#### 3. Backend API (`/backend-api`)
**Purpose**: Design and implement Supabase queries, manage service layer, handle authentication patterns, and optimize data fetching.

**Use when**:
- Writing Supabase queries
- Creating service functions
- Implementing authentication logic
- Optimizing data fetching
- Integrating external APIs (OpenAI)

**Example usage**:
```
/backend-api
Create a service function to fetch user progress across all assigned scenarios
```

#### 4. Testing (`/testing`)
**Purpose**: Design test strategies, write unit/integration/E2E tests, set up testing infrastructure, and ensure comprehensive test coverage.

**Use when**:
- Setting up testing frameworks
- Writing unit tests
- Creating integration tests
- Implementing E2E tests
- Improving test coverage

**Example usage**:
```
/testing
Write unit tests for the PersonaCard component
```

### Quality & Optimization Agents

#### 5. UX Reviewer (`/ux-reviewer`)
**Purpose**: Analyze user flows, identify UX pain points, suggest interface improvements, review accessibility, and ensure consistent design patterns.

**Use when**:
- Reviewing user flows
- Conducting accessibility audits
- Improving interface usability
- Ensuring design consistency
- Optimizing user journeys

**Example usage**:
```
/ux-reviewer
Review the training session flow for potential UX improvements
```

#### 6. Security Reviewer (`/security-reviewer`)
**Purpose**: Conduct security audits, identify vulnerabilities, review authentication/authorization, ensure data protection, and validate security best practices.

**Use when**:
- Conducting security audits
- Reviewing RLS policies for vulnerabilities
- Checking authentication implementation
- Validating data protection measures
- Identifying security risks

**Example usage**:
```
/security-reviewer
Audit the authentication flow for security vulnerabilities
```

#### 7. Performance Optimizer (`/performance-optimizer`)
**Purpose**: Identify performance bottlenecks, optimize React rendering, reduce bundle size, implement caching, and improve runtime performance.

**Use when**:
- Analyzing performance issues
- Optimizing component re-renders
- Reducing bundle size
- Implementing code splitting
- Optimizing data fetching

**Example usage**:
```
/performance-optimizer
Analyze and optimize the MyTrainingScenarios component for better performance
```

### Documentation Agent

#### 8. Documentation (`/documentation`)
**Purpose**: Create and maintain technical documentation, write user guides, document APIs, create architecture docs, and ensure documentation stays current.

**Use when**:
- Creating feature documentation
- Writing API documentation
- Documenting code with JSDoc
- Creating user guides
- Updating existing documentation

**Example usage**:
```
/documentation
Create comprehensive documentation for the scoring system feature
```

## How to Use Agents

### Basic Usage

1. **Invoke an agent** by typing its command:
   ```
   /db-admin
   ```

2. **Ask your question or give instructions**:
   ```
   /frontend-dev
   Create a custom hook for managing form state with validation
   ```

3. **The agent will respond** with specialized knowledge and context specific to its domain.

### Best Practices

#### Choose the Right Agent
- Use the agent that best matches your task
- If unsure, start with a general question and the agent will guide you

#### Be Specific
```
Good: /db-admin Create a migration to add email_verified column to users table
Bad: /db-admin Help with database
```

#### Combine Agents for Complex Tasks
```
1. /db-admin - Design the schema
2. /backend-api - Create service functions
3. /frontend-dev - Build the UI components
4. /testing - Write comprehensive tests
5. /documentation - Document the feature
```

#### Sequential vs. Parallel
- For dependent tasks, complete one agent's work before moving to the next
- For independent tasks, you can switch between agents as needed

## Agent Context

All agents have been configured with:

- **Application knowledge**: React 19, TypeScript, Material-UI 7, Supabase
- **Codebase structure**: Component organization, service layer, database schema
- **Established patterns**: Form dialogs, data fetching, routing, authentication
- **Project specifics**: RLS policies, role-based access, training session flow
- **Common issues**: Historical bugs, known pain points, technical debt

## Agent Specializations

### Database Admin
- PostgreSQL via Supabase
- Row Level Security (RLS)
- Stage-based migration structure
- Historical RLS issues (infinite recursion)

### Frontend Developer
- React 19 with hooks
- Material-UI sx prop styling
- TypeScript strict mode
- Form validation patterns
- localStorage persistence

### Backend API
- Supabase client patterns
- Multi-table queries
- Real-time subscriptions
- OpenAI API integration
- Error handling patterns

### Testing
- Recommended stack: Vitest + React Testing Library + Playwright
- No current testing setup (needs implementation)
- Comprehensive test patterns provided

### UX Reviewer
- WCAG 2.1 accessibility standards
- Nielsen's usability heuristics
- Material Design principles
- User flow analysis
- Mobile-first responsive design

### Security Reviewer
- OWASP Top 10
- Supabase security best practices
- RLS policy validation
- API key management
- Client-side security

### Performance Optimizer
- React rendering optimization
- Bundle size analysis
- Code splitting strategies
- Data fetching patterns
- Web Vitals targets

### Documentation
- Markdown standards
- JSDoc conventions
- Architecture documentation
- User guide writing
- API documentation

## Tips for Effective Agent Use

### 1. Provide Context
If working on a specific feature, mention it:
```
/frontend-dev
I'm working on the notifications feature. Create a NotificationBell component...
```

### 2. Reference Files
Mention specific files when relevant:
```
/backend-api
Review the query performance in MyTrainingScenarios.tsx
```

### 3. Ask for Explanations
Agents can explain their reasoning:
```
/security-reviewer
Why is storing the OpenAI API key client-side a security risk?
```

### 4. Request Multiple Options
```
/frontend-dev
Give me three different approaches to implement infinite scroll
```

### 5. Iterate on Solutions
```
/performance-optimizer
The lazy loading solution you suggested - can we make it work with our existing routing?
```

## When NOT to Use Agents

- **Simple questions**: "What does this function do?" - Just ask directly
- **General programming**: "How do I reverse a string?" - Not application-specific
- **Already in progress**: If an agent is already active, continue the conversation

## Maintenance

### Updating Agents
Agent definitions are stored in this directory as markdown files. To update:

1. Edit the relevant `.md` file
2. Update the agent's knowledge or patterns
3. Test the agent with sample queries
4. Document changes in this README

### Adding New Agents
To create a new agent:

1. Create a new `.md` file in this directory
2. Follow the existing agent structure
3. Define core responsibilities and specializations
4. Add relevant patterns and examples
5. Update this README with the new agent

## Feedback and Improvements

These agents are designed to evolve with the project. If you find:
- Missing information or context
- Outdated patterns
- Helpful improvements

Please update the agent files to improve their effectiveness.

## Quick Reference

| Task | Agent | Command |
|------|-------|---------|
| Database schema | Database Admin | `/db-admin` |
| React component | Frontend Developer | `/frontend-dev` |
| API query | Backend API | `/backend-api` |
| Write tests | Testing | `/testing` |
| UX review | UX Reviewer | `/ux-reviewer` |
| Security audit | Security Reviewer | `/security-reviewer` |
| Performance | Performance Optimizer | `/performance-optimizer` |
| Documentation | Documentation | `/documentation` |

---

**Happy coding with your specialized agents!** 🚀
