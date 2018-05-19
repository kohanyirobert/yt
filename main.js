const express = require('express')
const bodyParser = require('body-parser')
const { spawn } = require('child_process')
const { carry } = require('carrier')

function getJob(jobs, pid) {
    return jobs.find((job) => job.context.pid == pid)
}

function getPercentage(line) {
    const match = line.match(/(\d{2,3})(?:\.\d)?%/)
    if (match) {
        return parseInt(match[1], 10)
    }
    return null
}

const app = express()
const jobs = []

app.use(express.static('public'))
app.use(bodyParser.json())

app.get('/jobs', (req, res) => {
    res.json(jobs.map((job) => job.context))
})

app.get('/jobs/:pid', (req, res) => {
    const job = getJob(jobs, req.params.pid)
    if (job) {
        res.json(job.context)
    } else {
        res.json(null)
    }
})

app.delete('/jobs/:pid', (req, res) => {
    const job = getJob(jobs, req.params.pid)
    if (job) {
        job.process.kill()
        jobs.splice(jobs.indexOf(job), 1)
    }
    res.end()
})

app.post('/jobs', (req, res) => {
    const child = spawn('youtube-dl', [
        '--newline',
        '--output',
        req.body.out,
        req.body.url
    ])
    const job = {
        context: {
            pid: child.pid,
            params: req.body,
            progress: 0,
            status: 'starting',
            stdout: [],
            stderr: []
        },
        process: child
    }
    carry(child.stdout, (line) => {
        console.log("stdout", job.context.pid, line)
        job.context.stdout.push(line)
        const percentage = getPercentage(line)
        if (percentage) {
            job.context.progress = percentage
        }
        job.context.status = 'running'
    })
    carry(child.stderr, (line) => {
        console.error("stderr", job.context.pid, line)
        job.context.stderr.push(line)
    })
    child.on('error', (err) => {
        console.log('error', job.context.pid, err)
        job.context.status = 'error'
    })
    child.on('exit', (code, signal) => {
        console.log('exit', job.context.pid, code, signal)
        if (signal === 'SIGTERM') {
            job.context.status = 'cancelled'
        } else if (code === 0) {
            job.context.status = 'done'
        } else {
            job.context.status = 'error'
        }
    })
    jobs.push(job)
    res.end()
})

app.listen(58000, 'localhost')
