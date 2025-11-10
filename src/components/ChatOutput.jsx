import React from 'react';
import { BookOpen, Edit } from 'lucide-react';
import styles from './ChatStyles.module.css';

export const CourseOutput = ({ content, onExport }) => {
    if (!content || !content.modules || content.modules.length === 0) {
        return <p>The AI generated an empty or malformed course structure. Please try again.</p>;
    }

    return (
        <div className={styles.courseOutput}>
            <h3 className={styles.courseTitle}>
                <BookOpen className={styles.icon} />
                Generated Course: {content.title || "Untitled Course"}
            </h3>
            
            {content.modules.map((module, modIndex) => (
                <details key={modIndex} className={styles.moduleDetails} open> 
                    <summary className={styles.moduleSummary}>
                        {module.title}
                    </summary>
                    
                    <p className={styles.lessonHeading}>Lessons:</p>
                    <ul className={styles.lessonList}>
                        {module.lessons.map((lesson, lessonIndex) => (
                            <li key={lessonIndex} className={styles.lessonItem}>
                                {lesson}
                                {/* <button className={styles.editButton}>
                                    <Edit className={styles.editIcon} /> Edit
                                </button> */}
                            </li>
                        ))}
                    </ul>

                    {module.resources && module.resources.length > 0 && (
                        <div className={styles.resourceSection}>
                            <p className={styles.resourceHeading}>Study Materials:</p>
                            <ul className={styles.resourceList}>
                                {module.resources.map((resource, resIndex) => (
                                    <li key={resIndex} className={styles.resourceItem}>
                                        <span className={styles.resourceType}>[{resource.type}]</span>
                                        <a 
                                            href={resource.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className={styles.resourceLink}
                                        >
                                            {resource.title || resource.link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </details>
            ))}
            <button 
                className={styles.finalizeButton}
                onClick={() => onExport(content)}
            >
                Finalize & Export Course
            </button>
        </div>
    );
};