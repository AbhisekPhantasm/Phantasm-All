const fs = require('fs');
const path = require('path');

const resultsDir = 'allure-results';
const videoDir = 'test-videos';

if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir);
}

// Clean old videos
fs.readdirSync(videoDir).forEach(file => {
    fs.unlinkSync(path.join(videoDir, file));
});

console.log('Exporting videos from allure-results to /test-videos folder...');

const files = fs.readdirSync(resultsDir);
const resultFiles = files.filter(f => f.endsWith('-result.json'));

resultFiles.forEach(resultFile => {
    try {
        const content = JSON.parse(fs.readFileSync(path.join(resultsDir, resultFile), 'utf8'));
        const testName = content.name.replace(/[^a-z0-9]/gi, '_');
        
        const processSteps = (steps) => {
            steps.forEach(step => {
                if (step.attachments) {
                    step.attachments.forEach(attachment => {
                        if (attachment.type === 'video/webm' || attachment.type === 'video/mp4') {
                            const sourcePath = path.join(resultsDir, attachment.source);
                            if (fs.existsSync(sourcePath)) {
                                const ext = attachment.type === 'video/webm' ? '.webm' : '.mp4';
                                const destName = `${testName}${ext}`;
                                fs.copyFileSync(sourcePath, path.join(videoDir, destName));
                                console.log(`Exported: ${destName}`);
                            }
                        }
                    });
                }
                if (step.steps) processSteps(step.steps);
            });
        };

        if (content.steps) processSteps(content.steps);
        if (content.attachments) {
            content.attachments.forEach(attachment => {
                if (attachment.type === 'video/webm' || attachment.type === 'video/mp4') {
                    const sourcePath = path.join(resultsDir, attachment.source);
                    if (fs.existsSync(sourcePath)) {
                        const ext = attachment.type === 'video/webm' ? '.webm' : '.mp4';
                        const destName = `${testName}${ext}`;
                        fs.copyFileSync(sourcePath, path.join(videoDir, destName));
                        console.log(`Exported: ${destName}`);
                    }
                }
            });
        }
    } catch (err) {
        console.error(`Error processing ${resultFile}:`, err);
    }
});

console.log('Video export complete.');
