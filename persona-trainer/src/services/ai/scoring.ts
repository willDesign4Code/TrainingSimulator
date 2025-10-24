import openAIService from './openai';

export interface Rubric {
  id: string;
  scenario_id: string;
  metric_name: string;
  description: string;
  min_score: number;
  max_score: number;
  weight: number;
}

export interface RubricScore {
  rubric_id: string;
  metric_name: string;
  score: number;
  max_score: number;
  weight: number;
  feedback: string;
  evidence: string[];
}

export interface ScoringResult {
  rubric_scores: RubricScore[];
  total_score: number;
  max_total_score: number;
  percentage: number;
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
}

/**
 * Evaluates a conversation transcript against a set of rubrics using OpenAI
 */
export async function scoreConversation(
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>,
  rubrics: Rubric[]
): Promise<ScoringResult> {
  if (rubrics.length === 0) {
    throw new Error('No rubrics provided for scoring');
  }

  // Format the conversation transcript
  const conversationText = transcript
    .map((msg) => `${msg.role === 'user' ? 'Trainee' : 'AI Persona'}: ${msg.content}`)
    .join('\n\n');

  // Build the evaluation prompt
  const evaluationPrompt = `You are an expert training evaluator. Analyze the following conversation transcript and score the trainee's performance based on the provided rubrics.

CONVERSATION TRANSCRIPT:
${conversationText}

RUBRICS TO EVALUATE:
${rubrics
  .map(
    (rubric, index) => `
${index + 1}. ${rubric.metric_name}
   Description: ${rubric.description}
   Score Range: ${rubric.min_score} to ${rubric.max_score}
   Weight: ${rubric.weight}
`
  )
  .join('\n')}

INSTRUCTIONS:
For each rubric, provide:
1. A score within the specified range
2. Specific feedback explaining the score
3. Evidence from the conversation (specific quotes or examples)

Also provide:
- Overall feedback on the trainee's performance
- 2-3 key strengths demonstrated
- 2-3 areas for improvement

Respond in the following JSON format:
{
  "rubric_scores": [
    {
      "rubric_id": "rubric_id_here",
      "metric_name": "metric_name_here",
      "score": number,
      "feedback": "detailed feedback here",
      "evidence": ["quote 1", "quote 2"]
    }
  ],
  "overall_feedback": "overall feedback here",
  "strengths": ["strength 1", "strength 2"],
  "areas_for_improvement": ["area 1", "area 2"]
}`;

  try {
    // Call OpenAI to evaluate the conversation
    const response = await openAIService.sendChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert training evaluator. Analyze conversations and provide detailed, constructive feedback based on specific rubrics. Be fair, objective, and provide actionable insights. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: evaluationPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      maxTokens: 2000,
    });

    // Parse the JSON response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', response);
      throw new Error('Failed to parse scoring response from AI');
    }

    // Map rubric IDs and calculate scores
    const rubricScores: RubricScore[] = parsedResponse.rubric_scores.map(
      (score: any, index: number) => {
        const rubric = rubrics[index];
        return {
          rubric_id: rubric.id,
          metric_name: rubric.metric_name,
          score: Math.min(Math.max(score.score, rubric.min_score), rubric.max_score),
          max_score: rubric.max_score,
          weight: rubric.weight,
          feedback: score.feedback || 'No feedback provided',
          evidence: score.evidence || [],
        };
      }
    );

    // Calculate weighted total score
    const totalWeightedScore = rubricScores.reduce(
      (sum, score) => sum + (score.score / score.max_score) * score.weight,
      0
    );
    const totalWeight = rubrics.reduce((sum, rubric) => sum + rubric.weight, 0);
    const maxTotalScore = totalWeight;
    const percentage = (totalWeightedScore / maxTotalScore) * 100;

    return {
      rubric_scores: rubricScores,
      total_score: totalWeightedScore,
      max_total_score: maxTotalScore,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
      overall_feedback: parsedResponse.overall_feedback || 'Good effort overall.',
      strengths: parsedResponse.strengths || [],
      areas_for_improvement: parsedResponse.areas_for_improvement || [],
    };
  } catch (error) {
    console.error('Error scoring conversation:', error);
    throw new Error('Failed to score conversation. Please try again.');
  }
}

/**
 * Get a performance level based on percentage score
 */
export function getPerformanceLevel(percentage: number): {
  level: string;
  color: string;
  description: string;
} {
  if (percentage >= 90) {
    return {
      level: 'Excellent',
      color: '#4caf50',
      description: 'Outstanding performance! You exceeded expectations.',
    };
  } else if (percentage >= 75) {
    return {
      level: 'Good',
      color: '#8bc34a',
      description: 'Good job! You demonstrated strong skills.',
    };
  } else if (percentage >= 60) {
    return {
      level: 'Satisfactory',
      color: '#ff9800',
      description: 'Satisfactory performance with room for improvement.',
    };
  } else if (percentage >= 40) {
    return {
      level: 'Needs Improvement',
      color: '#ff5722',
      description: 'Additional practice recommended to improve skills.',
    };
  } else {
    return {
      level: 'Unsatisfactory',
      color: '#f44336',
      description: 'Significant improvement needed. Consider reviewing training materials.',
    };
  }
}
