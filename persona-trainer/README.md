# Persona Trainer

Persona Trainer is an interactive training platform designed to help managers and employees practice interpersonal and professional communication skills. Through realistic, AI-driven scenarios, users can engage with simulated personas to improve their confidence and effectiveness in a variety of workplace interactions.

## Project Overview

Persona Trainer enables users to:
- Practice conversations with AI-powered personas in realistic workplace scenarios
- Receive feedback and performance metrics on their communication skills
- Track progress over time and identify areas for improvement
- Access a library of scenarios across various professional contexts

### Use Cases
- Sales staff practicing pitches with simulated customers
- Managers rehearsing difficult conversations with underperforming employees
- Customer support training for handling escalations
- New hire onboarding for client-facing roles

## Technology Stack

### Frontend
- **React**: Core framework for building a dynamic, component-driven user interface
- **Vite**: Development build tool for fast and efficient development experience
- **TypeScript**: Provides type safety across the codebase
- **Material UI (MUI)**: Component library for consistent, professional UI design

### Backend & Services
- **Supabase**:
  - **Auth**: User authentication and role management
  - **Database**: PostgreSQL-based database for storing scenarios, user data, conversation history, etc.
  - **Edge Functions (optional)**: For server-side logic or integrations if needed

### AI Integration
- Simulated persona interactions powered by an AI backend
- Each persona has configurable traits, knowledge, and context to produce realistic dialog experiences

## Project Structure

```
persona-trainer/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components (buttons, inputs, etc.)
│   │   ├── layout/          # Layout components (header, footer, etc.)
│   │   ├── categories/      # Category management components
│   │   ├── topics/          # Topic management components
│   │   └── scenarios/       # Scenario-specific components
│   ├── contexts/            # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── services/            # API and service integrations
│   │   ├── supabase/        # Supabase client and utilities
│   │   └── ai/              # AI integration services
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── knowledge-base/          # Content for scenarios and personas
│   ├── categories/          # Training categories
│   ├── personas/            # Persona definitions
│   └── guidelines/          # Usage guidelines
└── [configuration files]    # Various config files for the project
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/persona-trainer.git
cd persona-trainer
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Demo Login
For demonstration purposes, you can use the following credentials:
- Email: admin@example.com
- Password: password

## Knowledge Base

The `knowledge-base` directory contains markdown files that define the training content:

- **Categories**: High-level groupings of related training content
- **Topics**: Specific areas of focus within a category
- **Scenarios**: Individual training situations with defined objectives
- **Personas**: Character definitions with personality traits, communication styles, and behaviors

These files serve as the foundation for the training scenarios and can be edited to customize the training experience.

## User Roles

- **Admin**: Full system access, can manage users, content, and system settings
- **Manager**: Can create and assign training content, view team analytics
- **Employee**: Can access assigned training and view personal progress

## License

[MIT License](LICENSE)

## Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com)
