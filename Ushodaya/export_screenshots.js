const fs = require('fs');
const path = require('path');

const resultsDir = 'allure-results';
const outputDir = 'screenshots';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Clean old screenshots
fs.readdirSync(outputDir).forEach(file => {
    fs.unlinkSync(path.join(outputDir, file));
});

console.log('Exporting screenshots from allure-results to /screenshots folder...');

const files = fs.readdirSync(resultsDir);
const resultFiles = files.filter(f => f.endsWith('-result.json'));

resultFiles.forEach(resultFile => {
    try {
        const content = JSON.parse(fs.readFileSync(path.join(resultsDir, resultFile), 'utf8'));
        const testName = content.name.replace(/[^a-z0-9]/gi, '_');
        
        // Find attachments in steps
        const processSteps = (steps) => {
            steps.forEach(step => {
                if (step.attachments) {
                    step.attachments.forEach(attachment => {
                        if (attachment.type === 'image/png') {
                            const sourcePath = path.join(resultsDir, attachment.source);
                            if (fs.existsSync(sourcePath)) {
                                const cleanLabel = attachment.name.replace(/[^a-z0-9]/gi, '_');
                                const destName = `${testName}__${cleanLabel}.png`;
                                fs.copyFileSync(sourcePath, path.join(outputDir, destName));
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
                if (attachment.type === 'image/png') {
                    const sourcePath = path.join(resultsDir, attachment.source);
                    if (fs.existsSync(sourcePath)) {
                        const cleanLabel = attachment.name.replace(/[^a-z0-9]/gi, '_');
                        const destName = `${testName}__${cleanLabel}.png`;
                        fs.copyFileSync(sourcePath, path.join(outputDir, destName));
                        console.log(`Exported: ${destName}`);
                    }
                }
            });
        }
    } catch (err) {
        console.error(`Error processing ${resultFile}:`, err);
    }
});

console.log('Screenshot export complete.');
