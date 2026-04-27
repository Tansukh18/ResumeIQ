const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })
    return JSON.parse(response.text)
}


async function generateResumeHtml({ resume, selfDescription, jobDescription }) {
    const prompt = `You are an expert resume writer and ATS optimization specialist.

Generate a professional, ATS-optimized resume in clean HTML for a candidate based on:
- Resume/Background: ${resume}
- Self Description: ${selfDescription}
- Target Job Description: ${jobDescription}

REQUIREMENTS:
1. Output ONLY a complete HTML document (with <html>, <head>, <body> tags)
2. Use inline CSS only (no external stylesheets, no Google Fonts links)
3. ATS-friendly: single column layout, no tables for layout, no images, no icons, standard system fonts (Arial, Helvetica, sans-serif)
4. Include these sections in order: Name + Contact Info, Professional Summary, Core Skills, Work Experience, Education, Certifications (if applicable)
5. Use <h1> for candidate name, <h2> for section headers, <p> and <ul><li> for content
6. Skills section: comma-separated keywords tailored to the job description for ATS parsing
7. Work Experience: bullet points with strong action verbs and quantified achievements where possible
8. Keep content concise, ideally 1-2 A4 pages when printed
9. CSS: body font-size 11pt, margins 15mm, name 22pt bold, section headers 13pt with bottom border #0f3460
10. Color: headings #1a1a2e, accent line #0f3460, body text #111111
11. Add @media print CSS to ensure proper page breaks and no header/footer from browser
12. The content must sound human-written and be highly tailored to the specific job description
13. Add this <style> for print: @media print { body { margin: 0; } @page { margin: 15mm; } }

Return as JSON: { "html": "<complete standalone html document>" }`

    const resumeHtmlSchema = z.object({
        html: z.string().describe("Complete standalone HTML document of the ATS-optimized resume")
    })

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumeHtmlSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)
    return jsonContent.html
}

module.exports = { generateInterviewReport, generateResumeHtml }