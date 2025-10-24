# Content Creation Guidelines

This guide provides instructions and best practices for creating effective training content in the Persona Trainer platform.

## Content Hierarchy

The Persona Trainer content is organized in a hierarchical structure:

1. **Categories**: Broad subject areas (e.g., Customer Service, Leadership, Sales)
2. **Topics**: Specific focus areas within a category (e.g., Handling Complaints, Performance Reviews)
3. **Scenarios**: Individual training situations with defined objectives (e.g., Product Defect Complaint)
4. **Personas**: Character definitions that can be used across scenarios

## Creating Categories

Categories are the highest level of organization in the content hierarchy. When creating a new category:

- Choose a clear, concise name that reflects the broad subject area
- Provide a comprehensive overview that explains the purpose and scope
- Define clear learning objectives that apply across all topics in the category
- Identify the target audience for this category of training
- List the key skills that will be developed through this training
- Outline the main topics that will be included in this category

**File Location**: `knowledge-base/categories/[category-name]/category-info.md`

## Creating Topics

Topics are specific areas of focus within a category. When creating a new topic:

- Choose a descriptive name that clearly indicates the focus area
- Provide an overview that explains the specific skills being developed
- Define the user role that trainees will assume during scenarios
- List specific learning objectives for this topic
- Identify key performance metrics that will be used to evaluate success
- Outline the scenarios that will be included in this topic

**File Location**: `knowledge-base/categories/[category-name]/topics/[topic-name]/topic-info.md`

## Creating Scenarios

Scenarios are individual training situations with defined objectives. When creating a new scenario:

- Choose a title that clearly indicates the specific situation
- Provide an overview that summarizes the scenario in one or two sentences
- Include detailed background information to set the context
- Define the customer/employee persona that will be simulated
- Specify the tone that the persona should adopt
- Add any additional context that will help the trainee understand the situation
- Create a comprehensive rubric with weighted metrics for evaluation
- Identify key challenges that make this scenario valuable for training
- Define what a successful outcome looks like
- Include sample dialogue starters to help initiate the conversation

**File Location**: `knowledge-base/categories/[category-name]/topics/[topic-name]/scenarios/[scenario-name].md`

## Creating Personas

Personas are character definitions with personality traits, communication styles, and behaviors. When creating a new persona:

- Provide basic information (name, age, pronouns, occupation)
- Define key personality traits that influence their communication
- Describe their communication style in detail
- Identify their goals and motivations
- List their interests and areas of knowledge
- Outline typical scenarios where this persona might appear
- Identify triggers that might cause escalation
- Suggest de-escalation techniques that work well with this persona
- Include sample dialogue to demonstrate their communication style
- Describe voice characteristics for potential voice synthesis
- Add any additional notes that help bring the persona to life

**File Location**: `knowledge-base/personas/[persona-name].md`

## Best Practices

### Writing Style

- Use clear, concise language
- Write in the present tense
- Use active voice rather than passive voice
- Be specific and provide examples
- Avoid jargon unless it's industry-specific and relevant
- Use bullet points and numbered lists for clarity
- Include headings and subheadings to organize content

### Creating Realistic Scenarios

- Base scenarios on real-world situations
- Include enough detail to make the scenario believable
- Create scenarios with varying difficulty levels
- Include common challenges and edge cases
- Make scenarios specific enough to be actionable
- Ensure scenarios align with learning objectives
- Include emotional elements that make the interaction realistic

### Developing Effective Rubrics

- Identify 4-6 key metrics for evaluation
- Ensure metrics align with learning objectives
- Assign appropriate weights to each metric
- Provide clear descriptions of what constitutes success for each metric
- Include both technical and soft skills in the evaluation
- Make rubrics specific to the scenario while maintaining consistency across similar scenarios

### Creating Engaging Personas

- Make personas multi-dimensional with both strengths and weaknesses
- Include specific traits that influence communication style
- Create a range of personas with different communication challenges
- Base personas on common archetypes but avoid stereotypes
- Include specific triggers and de-escalation techniques
- Provide enough detail to make the persona feel like a real person

## Markdown Formatting

All content files use Markdown formatting. Here are some common formatting elements:

```markdown
# Heading 1
## Heading 2
### Heading 3

- Bullet point
- Another bullet point
  - Nested bullet point

1. Numbered item
2. Another numbered item

**Bold text**
*Italic text*

[Link text](URL)

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

## Review Process

All new content should go through the following review process:

1. Initial draft creation
2. Peer review for content accuracy and relevance
3. Editorial review for clarity and consistency
4. Final approval by content manager
5. Implementation in the platform
6. User testing and feedback
7. Refinement based on feedback

## Content Maintenance

Content should be reviewed and updated regularly:

- Review all content at least annually
- Update scenarios to reflect current best practices
- Add new scenarios based on emerging trends and challenges
- Retire scenarios that are no longer relevant
- Incorporate user feedback into content improvements
