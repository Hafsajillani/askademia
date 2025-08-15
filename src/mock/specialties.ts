import type { SpecialtyDetailProps } from "../components";

// Array of specialties for the sidebar
export const specialties: string[] = [
    '24/7 Learning Support',
    'Personalized Learning',
    'Interactive Practice',
];

// Object containing details for each specialty
export const specialtyDetails: {
    [key: string]: SpecialtyDetailProps;
} = {
    '24/7 Learning Support': {
        description: "Get help anytime, anywhere. Our AI tutor is available 24/7 to answer your questions, explain concepts, and guide you through your learning journey.",
        image: '/images/learning-journey-balance.png'
    },
    'Personalized Learning': {
        description: 'Experience learning tailored to your needs. Our AI adapts to your learning style, pace, and goals to provide the most effective study experience.',
        image: '/images/personalized-study.png'
    },
    'Interactive Practice': {
        description: 'Learn by doing with interactive exercises, practice problems, and real-time feedback. Master concepts through hands-on experience and guided practice.',
        image: '/images/mathematics-practice.png'
    },
};