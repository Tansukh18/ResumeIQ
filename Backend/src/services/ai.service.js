const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const PDFDocument = require("pdfkit")
const Groq = require("groq-sdk")

// Initialize Groq from environment variables
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
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
    // Generate JSON schema string to instruct Groq
    const schemaStr = JSON.stringify(zodToJsonSchema(interviewReportSchema), null, 2);

    const systemPrompt = `You are an expert technical recruiter and AI interviewer.
You must output a valid JSON object that exactly matches the following JSON schema:
${schemaStr}

Return ONLY valid JSON. Do not return any markdown formatting or extra text.`;

    const userPrompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}`;

    try {
        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (err) {
        console.error("[AI Gen] Groq request failed:", err.message);
        throw err;
    }
}





// ─── RESUME TEXT PARSER ───────────────────────────────────────────────────────
function parseResumeText(rawText) {
    const text = rawText.replace(/-- \d+ of \d+ --/g, '').replace(/\r/g, '').trim()
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length < 2) return null

    const name = lines[0]

    // Contact line: has pipe | or @ or phone pattern
    const contactIdx = lines.findIndex((l, i) => i > 0 && i < 5 &&
        (l.includes('@') || l.includes('|') || /\+\d{2}/.test(l)))
    const contact = contactIdx >= 0 ? lines[contactIdx] : ''

    const SECTION_MAP = {
        'PROFESSIONAL SUMMARY': 'summary', 'SUMMARY': 'summary', 'OBJECTIVE': 'summary',
        'KEY SKILLS': 'skills', 'SKILLS': 'skills', 'TECHNICAL SKILLS': 'skills', 'CORE COMPETENCIES': 'skills',
        'PROFESSIONAL EXPERIENCE': 'experience', 'EXPERIENCE': 'experience', 'WORK EXPERIENCE': 'experience',
        'PROJECTS': 'projects', 'PROJECT EXPERIENCE': 'projects',
        'EDUCATION': 'education',
        'CERTIFICATIONS': 'certifications', 'CERTIFICATES': 'certifications',
        'ACHIEVEMENTS': 'achievements', 'AWARDS': 'achievements',
    }

    const sections = {}
    let currentKey = null
    const startIdx = contactIdx >= 0 ? contactIdx + 1 : 2

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i]
        const upper = line.toUpperCase().trim()
        const matched = Object.keys(SECTION_MAP).find(h => upper === h)
        if (matched) {
            currentKey = SECTION_MAP[matched]
            if (!sections[currentKey]) sections[currentKey] = []
        } else if (currentKey) {
            sections[currentKey].push(line)
        }
    }

    return { name, contact, sections }
}

// ─── PDFKIT RENDERER — ATS-FRIENDLY FORMAT ───────────────────────────────────
function renderResumePdf(doc, { name, contact, sections }) {
    const C = {
        name: '#0f172a', accent: '#1d4ed8', text: '#1e293b',
        muted: '#475569', line: '#cbd5e1'
    }
    const PW = 495 // page content width (595 - 50*2 margins)

    // ── NAME
    doc.fontSize(22).fillColor(C.name).font('Helvetica-Bold')
       .text(name, { align: 'center' })

    // ── CONTACT
    if (contact) {
        doc.moveDown(0.2)
        doc.fontSize(9.5).fillColor(C.muted).font('Helvetica')
           .text(contact, { align: 'center' })
    }

    doc.moveDown(0.4)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.accent).lineWidth(1.5).stroke()
    doc.moveDown(0.5)

    // ── Section header helper
    const secHeader = (title) => {
        doc.fillColor(C.accent).fontSize(11).font('Helvetica-Bold').text(title)
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.line).lineWidth(0.7).stroke()
        doc.moveDown(0.35)
    }

    // ── Bullet helper — single text run so ATS scanners read it cleanly
    const bullet = (text) => {
        doc.fillColor(C.text).fontSize(9.5).font('Helvetica')
           .text('\u2022  ' + text, { lineGap: 1.5, align: 'justify', indent: 14 })
        doc.moveDown(0.1)
    }

    // ── PROFESSIONAL SUMMARY
    if (sections.summary && sections.summary.length > 0) {
        secHeader('PROFESSIONAL SUMMARY')
        const para = sections.summary.join(' ').replace(/\s+/g, ' ').trim()
        doc.fillColor(C.text).fontSize(9.5).font('Helvetica')
           .text(para, { lineGap: 2, align: 'justify' })
        doc.moveDown(0.7)
    }

    // ── KEY SKILLS
    if (sections.skills && sections.skills.length > 0) {
        secHeader('KEY SKILLS')
        sections.skills.forEach(line => {
            const colonIdx = line.indexOf(':')
            if (colonIdx > 0) {
                const cat = line.slice(0, colonIdx).trim()
                const vals = line.slice(colonIdx + 1).replace(/^\t+/, '').trim()
                // Render as single line: bold category then normal values
                doc.fillColor(C.text).fontSize(9.5).font('Helvetica-Bold')
                   .text(cat + ':  ', { continued: true })
                doc.font('Helvetica').text(vals, { lineGap: 1 })
            } else {
                doc.fillColor(C.text).fontSize(9.5).font('Helvetica').text(line, { lineGap: 1 })
            }
            doc.moveDown(0.12)
        })
        doc.moveDown(0.5)
    }

    // ── PROFESSIONAL EXPERIENCE
    if (sections.experience && sections.experience.length > 0) {
        secHeader('PROFESSIONAL EXPERIENCE')
        sections.experience.forEach(line => {
            const isBullet = /^[●•\-\u2013\*]/.test(line)
            const isCompanyDate = line.includes('|') && /20\d\d|19\d\d/.test(line)
            if (isBullet) {
                bullet(line.replace(/^[●•\-\u2013\*]\s*/, ''))
            } else if (isCompanyDate) {
                doc.fillColor(C.muted).fontSize(9).font('Helvetica').text(line)
                doc.moveDown(0.2)
            } else {
                doc.fillColor(C.text).fontSize(10).font('Helvetica-Bold').text(line)
            }
        })
        doc.moveDown(0.6)
    }

    // ── PROJECTS
    if (sections.projects && sections.projects.length > 0) {
        secHeader('PROJECTS')
        sections.projects.forEach(line => {
            const isBullet = /^[●•\-\u2013\*]/.test(line)
            const isDateUrl = /20\d\d|19\d\d/.test(line) && (line.includes('|') || line.includes('.'))
            if (isBullet) {
                bullet(line.replace(/^[●•\-\u2013\*]\s*/, ''))
            } else if (isDateUrl) {
                doc.fillColor(C.muted).fontSize(9).font('Helvetica-Oblique').text(line)
                doc.moveDown(0.1)
            } else {
                // Project name — split bold part from pipe/dash
                const pipeIdx = line.indexOf('|')
                const dashIdx = line.indexOf(' \u2014 ')
                const splitAt = dashIdx > 0 ? dashIdx : (pipeIdx > 0 ? pipeIdx : -1)
                if (splitAt > 0) {
                    doc.fillColor(C.text).fontSize(10).font('Helvetica-Bold')
                       .text(line.slice(0, splitAt).trim(), { continued: true })
                    doc.fillColor(C.muted).font('Helvetica')
                       .text(' ' + line.slice(splitAt).trim())
                } else {
                    doc.fillColor(C.text).fontSize(10).font('Helvetica-Bold').text(line)
                }
            }
        })
        doc.moveDown(0.6)
    }

    // ── EDUCATION
    if (sections.education && sections.education.length > 0) {
        secHeader('EDUCATION')
        sections.education.forEach(line => {
            const isDetail = line.includes('|') && /20\d\d|19\d\d/.test(line)
            if (isDetail) {
                doc.fillColor(C.muted).fontSize(9).font('Helvetica').text(line)
            } else {
                doc.fillColor(C.text).fontSize(10).font('Helvetica-Bold').text(line)
            }
        })
        doc.moveDown(0.6)
    }

    // ── CERTIFICATIONS
    if (sections.certifications && sections.certifications.length > 0) {
        secHeader('CERTIFICATIONS')
        sections.certifications.forEach(line => {
            doc.fillColor(C.text).fontSize(9.5).font('Helvetica')
               .text('\u2022  ' + line, { lineGap: 2 })
        })
        doc.moveDown(0.5)
    }

    // ── ACHIEVEMENTS (if present)
    if (sections.achievements && sections.achievements.length > 0) {
        secHeader('ACHIEVEMENTS')
        sections.achievements.forEach(line => {
            doc.fillColor(C.text).fontSize(9.5).font('Helvetica').text('\u2022  ' + line, { lineGap: 2 })
        })
    }
}

// ─── MAIN PDF GENERATOR ───────────────────────────────────────────────────────
function generatePdfFromData({ resumeText, fallbackText }) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true })
        const buffers = []
        doc.on('data', chunk => buffers.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(buffers)))
        doc.on('error', reject)

        // Try to parse full resume text first
        const parsed = (resumeText && resumeText.length > 150) ? parseResumeText(resumeText) : null

        if (parsed && parsed.name) {
            renderResumePdf(doc, parsed)
        } else {
            // Fallback: simple plain layout for brief self-descriptions
            doc.fontSize(20).fillColor('#0f172a').font('Helvetica-Bold')
               .text('Professional Resume', { align: 'center' })
            doc.moveDown(0.5)
            doc.fontSize(10).fillColor('#1e293b').font('Helvetica')
               .text(fallbackText || 'Resume content not available.', { lineGap: 3 })
        }

        doc.end()
    })
}

async function generateResumePdf({ resume, selfDescription }, _interviewReport) {
    // Use the full stored resume text; fall back to selfDescription
    const pdfBuffer = await generatePdfFromData({
        resumeText: resume || '',
        fallbackText: selfDescription || resume || ''
    })
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }
