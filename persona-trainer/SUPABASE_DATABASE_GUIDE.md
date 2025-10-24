# Supabase Database Guide

## Overview

This guide provides comprehensive documentation for the Persona Trainer Supabase database structure, including table schemas, relationships, and implementation guidelines.

## Table of Contents
1. [Configuration](#configuration)
2. [Database Tables](#database-tables)
3. [Table Relationships](#table-relationships)
4. [SQL Schema Setup](#sql-schema-setup)
5. [TypeScript Types](#typescript-types)
6. [Implementation Examples](#implementation-examples)

---

## Configuration

### Environment Variables

Create a `.env` file in the `persona-trainer` directory with the following variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Client Setup

The Supabase client is configured in `src/services/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Database Tables

### 1. Users Table

**Purpose**: Store user information and authentication details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR | UNIQUE, NOT NULL | User email address |
| `name` | VARCHAR | NOT NULL | User full name |
| `role` | ENUM | NOT NULL | User role: 'admin', 'manager', or 'employee' |
| `department` | VARCHAR | NULLABLE | User's department |
| `manager_id` | UUID | FOREIGN KEY → users(id) | Reference to manager |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `last_login` | TIMESTAMP | NULLABLE | Last login timestamp |

**TypeScript Type**:
```typescript
type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string;
  manager_id?: string;
  created_at: string;
  last_login?: string;
};
```

---

### 2. Categories Table

**Purpose**: Top-level training content organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique category identifier |
| `name` | VARCHAR | NOT NULL | Category name |
| `details` | TEXT | NOT NULL | Category description |
| `image_url` | VARCHAR | NULLABLE | Category image URL |
| `is_ai_generated_image` | BOOLEAN | DEFAULT FALSE | Whether image is AI-generated |
| `created_by` | UUID | FOREIGN KEY → users(id) | Creator user ID |
| `is_public` | BOOLEAN | DEFAULT FALSE | Public visibility flag |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**TypeScript Type**:
```typescript
type Category = {
  id: string;
  name: string;
  details: string;
  image_url?: string;
  is_ai_generated_image: boolean;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};
```

---

### 3. Topics Table

**Purpose**: Intermediate training content organization within categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique topic identifier |
| `category_id` | UUID | FOREIGN KEY → categories(id) | Parent category |
| `name` | VARCHAR | NOT NULL | Topic name |
| `details` | TEXT | NOT NULL | Topic description |
| `user_role` | VARCHAR | NOT NULL | Target user role |
| `created_by` | UUID | FOREIGN KEY → users(id) | Creator user ID |
| `is_public` | BOOLEAN | DEFAULT FALSE | Public visibility flag |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**TypeScript Type**:
```typescript
type Topic = {
  id: string;
  category_id: string;
  name: string;
  details: string;
  user_role: string;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};
```

---

### 4. Personas Table

**Purpose**: Store AI personas for training scenarios

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique persona identifier |
| `name` | VARCHAR | NOT NULL | Persona name |
| `age` | INTEGER | NOT NULL | Persona age |
| `pronoun` | VARCHAR | NOT NULL | Preferred pronoun |
| `occupation` | VARCHAR | NOT NULL | Persona occupation |
| `voice` | VARCHAR | NULLABLE | Voice type for TTS |
| `interests` | TEXT[] | ARRAY | Array of interests |
| `goals` | TEXT[] | ARRAY | Array of goals |
| `image_url` | VARCHAR | NULLABLE | Persona image URL |
| `is_ai_generated_image` | BOOLEAN | DEFAULT FALSE | Whether image is AI-generated |
| `created_by` | UUID | FOREIGN KEY → users(id) | Creator user ID |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**TypeScript Type**:
```typescript
type Persona = {
  id: string;
  name: string;
  age: number;
  pronoun: string;
  occupation: string;
  voice?: string;
  interests: string[];
  goals: string[];
  image_url?: string;
  is_ai_generated_image: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};
```

---

### 5. Scenarios Table

**Purpose**: Training scenarios with persona integration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique scenario identifier |
| `topic_id` | UUID | FOREIGN KEY → topics(id) | Parent topic |
| `title` | VARCHAR | NOT NULL | Scenario title |
| `details` | TEXT | NOT NULL | Scenario description |
| `persona_id` | UUID | FOREIGN KEY → personas(id) | Associated persona |
| `persona_tone` | VARCHAR | NULLABLE | Persona tone for scenario |
| `persona_additional_details` | TEXT | NULLABLE | Extra persona context |
| `created_by` | UUID | FOREIGN KEY → users(id) | Creator user ID |
| `is_public` | BOOLEAN | DEFAULT FALSE | Public visibility flag |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**TypeScript Type**:
```typescript
type Scenario = {
  id: string;
  topic_id: string;
  title: string;
  details: string;
  persona_id: string;
  persona_tone?: string;
  persona_additional_details?: string;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};
```

---

### 6. Rubrics Table

**Purpose**: Define scoring metrics for scenarios

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique rubric identifier |
| `scenario_id` | UUID | FOREIGN KEY → scenarios(id) | Parent scenario |
| `metric_name` | VARCHAR | NOT NULL | Metric name (e.g., "Empathy") |
| `description` | TEXT | NOT NULL | Metric description |
| `min_score` | INTEGER | NOT NULL | Minimum score value |
| `max_score` | INTEGER | NOT NULL | Maximum score value |
| `weight` | NUMERIC | NOT NULL | Weight for overall score |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**TypeScript Type**:
```typescript
type Rubric = {
  id: string;
  scenario_id: string;
  metric_name: string;
  description: string;
  min_score: number;
  max_score: number;
  weight: number;
  created_at: string;
  updated_at: string;
};
```

---

### 7. Training Sessions Table

**Purpose**: Track user training sessions and performance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique session identifier |
| `user_id` | UUID | FOREIGN KEY → users(id) | User taking training |
| `scenario_id` | UUID | FOREIGN KEY → scenarios(id) | Scenario being trained |
| `assignment_id` | UUID | FOREIGN KEY → content_assignments(id) | Related assignment |
| `start_time` | TIMESTAMP | NOT NULL | Session start time |
| `end_time` | TIMESTAMP | NULLABLE | Session end time |
| `overall_score` | NUMERIC | NULLABLE | Overall performance score |
| `feedback` | TEXT | NULLABLE | AI-generated feedback |
| `reviewed_by` | UUID | FOREIGN KEY → users(id) | Manager who reviewed |
| `review_notes` | TEXT | NULLABLE | Manager review notes |

**TypeScript Type**:
```typescript
type TrainingSession = {
  id: string;
  user_id: string;
  scenario_id: string;
  assignment_id?: string;
  start_time: string;
  end_time?: string;
  overall_score?: number;
  feedback?: string;
  reviewed_by?: string;
  review_notes?: string;
};
```

---

### 8. Content Assignments Table

**Purpose**: Assign training content to users or teams

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique assignment identifier |
| `content_type` | ENUM | NOT NULL | Type: 'category', 'topic', 'scenario' |
| `content_id` | UUID | NOT NULL | ID of assigned content |
| `assigned_to_type` | ENUM | NOT NULL | Target type: 'user' or 'team' |
| `assigned_to_id` | UUID | NOT NULL | User or team ID |
| `assigned_by` | UUID | FOREIGN KEY → users(id) | Manager who assigned |
| `due_date` | TIMESTAMP | NULLABLE | Assignment due date |
| `priority` | ENUM | NULLABLE | Priority: 'low', 'medium', 'high' |
| `assigned_at` | TIMESTAMP | DEFAULT NOW() | Assignment timestamp |
| `completed_at` | TIMESTAMP | NULLABLE | Completion timestamp |

**TypeScript Type**:
```typescript
type ContentAssignment = {
  id: string;
  content_type: 'category' | 'topic' | 'scenario';
  content_id: string;
  assigned_to_type: 'user' | 'team';
  assigned_to_id: string;
  assigned_by: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  assigned_at: string;
  completed_at?: string;
};
```

---

## Table Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    Users    │
│  (id: PK)   │
└──────┬──────┘
       │
       ├──(created_by)─────┬──────────────────┐
       │                   │                  │
       ▼                   ▼                  ▼
┌────────────┐      ┌───────────┐     ┌──────────────┐
│ Categories │      │  Personas │     │    Topics    │
│  (id: PK)  │      │  (id: PK) │     │   (id: PK)   │
└─────┬──────┘      └─────┬─────┘     └──────┬───────┘
      │                   │                   │
      │(category_id)      │                   │(topic_id)
      │                   │                   │
      └──────────┬────────┘                   │
                 │                            │
                 ▼                            │
          ┌───────────┐◄───────────────────┘
          │ Scenarios │
          │ (id: PK)  │
          └─────┬─────┘
                │
                ├──(scenario_id)───┐
                │                  │
                ▼                  ▼
         ┌───────────┐      ┌───────────────────┐
         │  Rubrics  │      │ Training Sessions │
         │ (id: PK)  │      │     (id: PK)      │
         └───────────┘      └───────────────────┘
                                     ▲
                                     │(assignment_id)
                                     │
                            ┌────────────────────┐
                            │ Content Assignments│
                            │      (id: PK)      │
                            └────────────────────┘
```

### Key Relationships

1. **Users → Categories/Topics/Scenarios/Personas** (One-to-Many)
   - Users create content (tracked via `created_by`)

2. **Categories → Topics** (One-to-Many)
   - Each topic belongs to one category

3. **Topics → Scenarios** (One-to-Many)
   - Each scenario belongs to one topic

4. **Personas → Scenarios** (One-to-Many)
   - Each scenario uses one persona

5. **Scenarios → Rubrics** (One-to-Many)
   - Each scenario has multiple scoring metrics

6. **Scenarios → Training Sessions** (One-to-Many)
   - Multiple sessions can use the same scenario

7. **Users → Training Sessions** (One-to-Many)
   - Users complete training sessions

8. **Content Assignments** (Polymorphic)
   - Can assign categories, topics, or scenarios
   - Can assign to users or teams

---

## SQL Schema Setup

### Important Notes About ENUMs in Supabase

**Yes, ENUMs ARE supported** in Supabase (it's PostgreSQL under the hood)! However, they have trade-offs:

| Feature | Option 1: ENUMs | Option 2: VARCHAR + CHECK |
|---------|----------------|---------------------------|
| **Database Validation** | ✅ Automatic | ✅ Via CHECK constraints |
| **Easy to Modify** | ❌ Requires ALTER TYPE | ✅ Just update CHECK |
| **Type Safety** | ✅ Native type | ⚠️ Just a string |
| **Performance** | ✅ Slightly faster | ✅ Nearly identical |
| **Flexibility** | ❌ Rigid | ✅ Easy to change |
| **Best For** | Stable, unchanging values | Iterating/prototyping |

**Recommendation**: For this project, I recommend **Option 2 (No ENUMs)** below since you're still iterating on features. You can always migrate to ENUMs later if needed.

---

### Option 1: Create Tables with ENUMs

Run these SQL commands in your Supabase SQL editor:

```sql
-- Note: Supabase has gen_random_uuid() built-in, no extension needed!

-- Create ENUM types (optional - you can use VARCHAR with CHECK constraints instead)
-- ENUMs are supported in Supabase but can be harder to modify later
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE content_type AS ENUM ('category', 'topic', 'scenario');
CREATE TYPE assignment_target AS ENUM ('user', 'team');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- 1. Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  department VARCHAR(255),
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Personas table
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  pronoun VARCHAR(50) NOT NULL,
  occupation VARCHAR(255) NOT NULL,
  voice VARCHAR(50),
  interests TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  image_url VARCHAR(500),
  is_ai_generated_image BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  image_url VARCHAR(500),
  is_ai_generated_image BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  user_role VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  persona_tone VARCHAR(100),
  persona_additional_details TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Rubrics table
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  metric_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Training sessions table
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  assignment_id UUID,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  overall_score NUMERIC(5,2),
  feedback TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT
);

-- 8. Content assignments table
CREATE TABLE content_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,
  assigned_to_type assignment_target NOT NULL,
  assigned_to_id UUID NOT NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  priority priority_level,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key for assignment_id after content_assignments is created
ALTER TABLE training_sessions
ADD CONSTRAINT fk_training_sessions_assignment
FOREIGN KEY (assignment_id) REFERENCES content_assignments(id) ON DELETE SET NULL;
```

---

### Option 2: Create Tables WITHOUT ENUMs (Recommended)

This approach uses VARCHAR with CHECK constraints instead of ENUMs for maximum flexibility:

```sql
-- Note: Supabase has gen_random_uuid() built-in, no extension needed!

-- 1. Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  department VARCHAR(255),
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Personas table
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  pronoun VARCHAR(50) NOT NULL,
  occupation VARCHAR(255) NOT NULL,
  voice VARCHAR(50),
  interests TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  image_url VARCHAR(500),
  is_ai_generated_image BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  image_url VARCHAR(500),
  is_ai_generated_image BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  user_role VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  persona_tone VARCHAR(100),
  persona_additional_details TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Rubrics table
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  metric_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Training sessions table
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  assignment_id UUID,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  overall_score NUMERIC(5,2),
  feedback TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT
);

-- 8. Content assignments table
CREATE TABLE content_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('category', 'topic', 'scenario')),
  content_id UUID NOT NULL,
  assigned_to_type VARCHAR(10) NOT NULL CHECK (assigned_to_type IN ('user', 'team')),
  assigned_to_id UUID NOT NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key for assignment_id after content_assignments is created
ALTER TABLE training_sessions
ADD CONSTRAINT fk_training_sessions_assignment
FOREIGN KEY (assignment_id) REFERENCES content_assignments(id) ON DELETE SET NULL;
```

---

### Step 2: Create Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_manager_id ON users(manager_id);

CREATE INDEX idx_categories_created_by ON categories(created_by);
CREATE INDEX idx_categories_is_public ON categories(is_public);

CREATE INDEX idx_topics_category_id ON topics(category_id);
CREATE INDEX idx_topics_created_by ON topics(created_by);

CREATE INDEX idx_scenarios_topic_id ON scenarios(topic_id);
CREATE INDEX idx_scenarios_persona_id ON scenarios(persona_id);
CREATE INDEX idx_scenarios_created_by ON scenarios(created_by);

CREATE INDEX idx_personas_created_by ON personas(created_by);

CREATE INDEX idx_rubrics_scenario_id ON rubrics(scenario_id);

CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_training_sessions_scenario_id ON training_sessions(scenario_id);
CREATE INDEX idx_training_sessions_assignment_id ON training_sessions(assignment_id);

CREATE INDEX idx_content_assignments_assigned_to ON content_assignments(assigned_to_id);
CREATE INDEX idx_content_assignments_content ON content_assignments(content_type, content_id);
```

### Step 3: Create Updated Timestamp Function

```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rubrics_updated_at BEFORE UPDATE ON rubrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assignments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Categories policies (public or created by user)
CREATE POLICY "Anyone can view public categories"
  ON categories FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create categories"
  ON categories FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (created_by = auth.uid());

-- Similar policies for topics, scenarios, personas
-- (Copy pattern from categories and adjust table names)

-- Training sessions policies
CREATE POLICY "Users can view their own training sessions"
  ON training_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view their team's sessions"
  ON training_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = training_sessions.user_id
      AND users.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own sessions"
  ON training_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

---

## TypeScript Types

All types are defined in `src/services/supabase/client.ts`. Import them like this:

```typescript
import { User, Category, Topic, Scenario, Persona, Rubric, TrainingSession, ContentAssignment } from '@/services/supabase/client';
```

---

## Implementation Examples

### 1. Fetching Categories

```typescript
import { supabase } from '@/services/supabase/client';
import type { Category } from '@/services/supabase/client';

// Get all public categories
const { data: categories, error } = await supabase
  .from('categories')
  .select('*')
  .eq('is_public', true)
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error fetching categories:', error);
} else {
  console.log('Categories:', categories);
}
```

### 2. Creating a New Persona

```typescript
import { supabase } from '@/services/supabase/client';
import type { Persona } from '@/services/supabase/client';

const newPersona: Omit<Persona, 'id' | 'created_at' | 'updated_at'> = {
  name: 'Alex Morgan',
  age: 34,
  pronoun: 'they/them',
  occupation: 'Marketing Manager',
  voice: 'alloy',
  interests: ['technology', 'productivity', 'design'],
  goals: ['career advancement', 'work-life balance'],
  image_url: 'https://example.com/alex.jpg',
  is_ai_generated_image: true,
  created_by: 'user-uuid-here'
};

const { data, error } = await supabase
  .from('personas')
  .insert([newPersona])
  .select()
  .single();

if (error) {
  console.error('Error creating persona:', error);
} else {
  console.log('Created persona:', data);
}
```

### 3. Getting Scenarios with Related Data

```typescript
import { supabase } from '@/services/supabase/client';

// Fetch scenarios with their personas and rubrics
const { data: scenarios, error } = await supabase
  .from('scenarios')
  .select(`
    *,
    persona:personas(*),
    rubrics(*),
    topic:topics(
      *,
      category:categories(*)
    )
  `)
  .eq('is_public', true);

if (error) {
  console.error('Error fetching scenarios:', error);
} else {
  console.log('Scenarios with relations:', scenarios);
}
```

### 4. Recording a Training Session

```typescript
import { supabase } from '@/services/supabase/client';
import type { TrainingSession } from '@/services/supabase/client';

const session: Omit<TrainingSession, 'id'> = {
  user_id: 'current-user-uuid',
  scenario_id: 'scenario-uuid',
  assignment_id: 'assignment-uuid', // optional
  start_time: new Date().toISOString(),
  end_time: null,
  overall_score: null,
  feedback: null,
  reviewed_by: null,
  review_notes: null
};

const { data, error } = await supabase
  .from('training_sessions')
  .insert([session])
  .select()
  .single();

if (error) {
  console.error('Error creating session:', error);
} else {
  console.log('Session started:', data);
}
```

### 5. Updating Training Session Score

```typescript
import { supabase } from '@/services/supabase/client';

const sessionId = 'session-uuid';

const { data, error } = await supabase
  .from('training_sessions')
  .update({
    end_time: new Date().toISOString(),
    overall_score: 85.5,
    feedback: 'Great job! You demonstrated excellent empathy and problem-solving skills.'
  })
  .eq('id', sessionId)
  .select()
  .single();

if (error) {
  console.error('Error updating session:', error);
} else {
  console.log('Session completed:', data);
}
```

### 6. Assigning Content to Users

```typescript
import { supabase } from '@/services/supabase/client';
import type { ContentAssignment } from '@/services/supabase/client';

const assignment: Omit<ContentAssignment, 'id' | 'assigned_at' | 'completed_at'> = {
  content_type: 'scenario',
  content_id: 'scenario-uuid',
  assigned_to_type: 'user',
  assigned_to_id: 'employee-uuid',
  assigned_by: 'manager-uuid',
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  priority: 'high'
};

const { data, error } = await supabase
  .from('content_assignments')
  .insert([assignment])
  .select()
  .single();

if (error) {
  console.error('Error creating assignment:', error);
} else {
  console.log('Assignment created:', data);
}
```

### 7. Getting User's Training Progress

```typescript
import { supabase } from '@/services/supabase/client';

const userId = 'user-uuid';

const { data: progress, error } = await supabase
  .from('training_sessions')
  .select(`
    *,
    scenario:scenarios(
      title,
      topic:topics(
        name,
        category:categories(name)
      )
    )
  `)
  .eq('user_id', userId)
  .order('start_time', { ascending: false });

if (error) {
  console.error('Error fetching progress:', error);
} else {
  console.log('Training progress:', progress);
}
```

---

## Best Practices

### 1. Use Transactions for Complex Operations

```typescript
// When creating scenarios with rubrics
const { data: scenario, error: scenarioError } = await supabase
  .from('scenarios')
  .insert([newScenario])
  .select()
  .single();

if (!scenarioError && scenario) {
  const rubrics = [
    { scenario_id: scenario.id, metric_name: 'Empathy', ... },
    { scenario_id: scenario.id, metric_name: 'Communication', ... }
  ];

  const { error: rubricsError } = await supabase
    .from('rubrics')
    .insert(rubrics);
}
```

### 2. Always Handle Errors

```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*');

if (error) {
  // Log error for debugging
  console.error('Database error:', error);

  // Show user-friendly message
  alert('Failed to load categories. Please try again.');

  return;
}

// Process data
console.log(data);
```

### 3. Use TypeScript Types

```typescript
// Type-safe function
async function getCategory(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data as Category;
}
```

### 4. Optimize Queries with Indexes

When querying, use indexed columns for better performance:
- Always filter by indexed columns first
- Use `eq()` for exact matches on indexed fields
- Limit results with `.limit()` when possible

---

## Migration from Mock Data

### Current Status

The application currently uses mock data in:
- `src/pages/Categories.tsx`
- `src/pages/Personas.tsx`
- `src/pages/CategoryDetails.tsx`
- `src/pages/TopicDetails.tsx`

### Migration Steps

1. Set up Supabase database using SQL scripts above
2. Replace mock data arrays with Supabase queries
3. Add loading states while fetching data
4. Add error handling for failed queries
5. Update create/update/delete operations to use Supabase
6. Test all CRUD operations
7. Enable RLS policies for security

### Example Migration

**Before (Mock Data)**:
```typescript
const mockCategories: Category[] = [
  { id: '1', name: 'Customer Service', ... }
];
```

**After (Supabase)**:
```typescript
const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_public', true);

    if (error) {
      setError(error.message);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }

  fetchCategories();
}, []);
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Design Best Practices](https://supabase.com/docs/guides/database/database-design)

---

## Support

For questions or issues:
1. Check the Supabase dashboard for query logs
2. Review the browser console for errors
3. Check the network tab for API calls
4. Verify environment variables are set correctly
