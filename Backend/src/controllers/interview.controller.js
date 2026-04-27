const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumeHtml } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        let resumeText = ""

        // Parse PDF if file uploaded
        if (req.file && req.file.buffer) {
            try {
                const resumeContent = await pdfParse(Buffer.from(req.file.buffer))
                resumeText = resumeContent.text || ""
            } catch (parseErr) {
                console.error("PDF parse error:", parseErr)
                resumeText = ""
            }
        }

        const { selfDescription, jobDescription } = req.body

        if (!resumeText && !selfDescription) {
            return res.status(400).json({
                message: "Please provide either a resume file or self description."
            })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })

    } catch (err) {
        console.error("generateInterViewReportController error:", err)
        res.status(500).json({ message: "Failed to generate interview report. Please try again." })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("getInterviewReportByIdController error:", err)
        res.status(500).json({ message: "Failed to fetch interview report." })
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error("getAllInterviewReportsController error:", err)
        res.status(500).json({ message: "Failed to fetch interview reports." })
    }
}


/**
 * @description Controller to generate resume HTML for browser print-to-PDF.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        if (!jobDescription) {
            return res.status(400).json({
                message: "Interview report is missing job description data."
            })
        }

        const htmlContent = await generateResumeHtml({
            resume: resume || "",
            jobDescription,
            selfDescription: selfDescription || ""
        })

        res.status(200).json({
            message: "Resume HTML generated successfully.",
            html: htmlContent
        })

    } catch (err) {
        console.error("generateResumePdfController error:", err?.message || err)
        res.status(500).json({
            message: "Resume generation failed. Please try again.",
            error: err?.message
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }