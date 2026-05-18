import fs from 'fs';
import path from 'path';

export function logAction(pageName: string, action: string) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [${pageName}] ${action}`;

    // Print to console
    console.log(message);

    // Append to qa_execution.log in the project root
    const logFilePath = path.join(process.cwd(), 'qa_execution.log');
    fs.appendFileSync(logFilePath, message + '\n', 'utf8');
}