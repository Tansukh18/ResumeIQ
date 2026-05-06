const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const PDFDocument = require("pdfkit")

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
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}




function generatePdfFromData({ report, selfDescription }) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: "A4" })
        const buffers = []
        doc.on("data", chunk => buffers.push(chunk))
        doc.on("end", () => resolve(Buffer.concat(buffers)))
        doc.on("error", reject)

        const primaryColor = "#1a56db"
        const darkText = "#1e293b"
        const mutedText = "#64748b"
        const lightLine = "#e2e8f0"

        // Header
        doc.fontSize(24).fillColor(primaryColor).font("Helvetica-Bold")
           .text(report.title || "Professional Resume", { align: "center" })
        doc.moveDown(0.3)

        if (selfDescription) {
            doc.fontSize(10).fillColor(mutedText).font("Helvetica")
               .text(selfDescription.slice(0, 200), { align: "center" })
        }

        doc.moveDown(0.5)
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(primaryColor).lineWidth(2).stroke()
        doc.moveDown(0.6)

        // Match score
        const bannerY = doc.y
        doc.rect(50, bannerY, 495, 26).fill("#e8f0fe")
        doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold")
           .text(`ATS Match Score: ${report.matchScore || "N/A"}%   |   Role: ${(report.title || "Target Role").slice(0, 60)}`,
                 60, bannerY + 7, { lineBreak: false })
        doc.moveDown(1.4)

        const sectionHeader = (title) => {
            doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text(title.toUpperCase())
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(lightLine).lineWidth(1).stroke()
            doc.moveDown(0.4)
        }

        // Professional Summary
        sectionHeader("Professional Summary")
        const summary = selfDescription ||
            `Motivated professional targeting a ${report.title} position with strong technical and analytical skills.`
        doc.fillColor(darkText).fontSize(10).font("Helvetica").text(summary, { lineGap: 3 })
        doc.moveDown(0.8)

        // Skills
        if (report.skillGaps && report.skillGaps.length > 0) {
            sectionHeader("Key Skills")
            const skills = report.skillGaps.map(sg => {
                if (typeof sg === "object") return sg.skill || sg.area || sg.name || Object.values(sg)[0] || ""
                return String(sg)
            }).filter(Boolean)
            const half = Math.ceil(skills.length / 2)
            const col1 = skills.slice(0, half)
            const col2 = skills.slice(half)
            const startY = doc.y
            col1.forEach((skill, i) => {
                doc.fillColor(darkText).fontSize(10).font("Helvetica")
                   .text(`• ${skill}`, 50, startY + i * 16, { width: 230 })
            })
            col2.forEach((skill, i) => {
                doc.fillColor(darkText).fontSize(10).font("Helvetica")
                   .text(`• ${skill}`, 290, startY + i * 16, { width: 255 })
            })
            doc.y = startY + Math.max(col1.length, col2.length) * 16 + 6
            doc.moveDown(0.8)
        }

        // Technical Competencies
        if (report.technicalQuestions && report.technicalQuestions.length > 0) {
            sectionHeader("Technical Competency Areas")
            report.technicalQuestions.slice(0, 5).forEach(q => {
                const topic = typeof q === "object" ? (q.topic || q.question || q.area || JSON.stringify(q).slice(0, 80)) : String(q)
                doc.fillColor(darkText).fontSize(10).font("Helvetica")
                   .text(`▸  ${topic.slice(0, 100)}`, { lineGap: 2 })
            })
            doc.moveDown(0.8)
        }

        // Preparation Plan
        if (report.preparationPlan && report.preparationPlan.length > 0) {
            sectionHeader("Preparation & Growth Plan")
            report.preparationPlan.slice(0, 5).forEach((day, idx) => {
                const label = typeof day === "object" ? (day.day || day.title || `Phase ${idx + 1}`) : `Phase ${idx + 1}`
                const detail = typeof day === "object" ? (Array.isArray(day.tasks) ? day.tasks.join(", ") : day.focus || day.description || "") : String(day)
                doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text(label, { continued: !!detail })
                if (detail) doc.fillColor(darkText).font("Helvetica").text(` — ${detail.slice(0, 120)}`)
                else doc.text("")
                doc.moveDown(0.2)
            })
        }

        // Footer
        doc.moveDown(1)
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(lightLine).lineWidth(1).stroke()
        doc.moveDown(0.4)
        doc.fillColor(mutedText).fontSize(9).font("Helvetica")
           .text("Generated by ResumeIQ • resume-iq-oci5.vercel.app", { align: "center" })

        doc.end()
    })
}


async function generateResumePdf({ resume, selfDescription, jobDescription }, interviewReport) {
    const pdfBuffer = await generatePdfFromData({
        report: interviewReport,
        selfDescription: selfDescription || resume || ""
    })
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }