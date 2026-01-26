import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TUTORIAL_STEPS = [
    {
        title: 'Welcome to Cook Tracker!',
        description: 'Track attendance, milk quantities, and payments for your household help with ease.',
        icon: 'home',
        color: '#7E57C2'
    },
    {
        title: 'Switch Profiles',
        description: 'Tap on the top chips to switch between your Cook, Maid, and Milk worker profiles.',
        icon: 'people',
        color: '#4CAF50'
    },
    {
        title: 'Mark Attendance',
        description: 'Simply tap the Morning or Evening cards to mark attendance. For Milk workers, you can adjust quantities.',
        icon: 'checkbox',
        color: '#FFA000'
    },
    {
        title: 'Payments & Balance',
        description: 'Go to the Payments tab to record payments, set monthly salaries, or adjust rates per litre.',
        icon: 'wallet',
        color: '#3F51B5'
    },
    {
        title: 'Ready to Start?',
        description: 'All your data is saved locally on your phone. You can always see history in the Calendar tab.',
        icon: 'rocket',
        color: '#E91E63'
    }
];

const TutorialModal = ({ visible, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onFinish();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = TUTORIAL_STEPS[currentStep];

    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: step.color + '15' }]}>
                        <Ionicons name={step.icon} size={64} color={step.color} />
                    </View>

                    <Text style={styles.title}>{step.title}</Text>
                    <Text style={styles.description}>{step.description}</Text>

                    <View style={styles.indicatorRow}>
                        {TUTORIAL_STEPS.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.indicator,
                                    index === currentStep && { backgroundColor: step.color, width: 20 }
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.footer}>
                        {currentStep > 0 ? (
                            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                                <Text style={styles.backBtnText}>Back</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 80 }} />
                        )}

                        <TouchableOpacity
                            style={[styles.nextBtn, { backgroundColor: step.color }]}
                            onPress={handleNext}
                        >
                            <Text style={styles.nextBtnText}>
                                {currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 16
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32
    },
    indicatorRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 32
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#eee'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
    },
    backBtn: {
        padding: 12,
    },
    backBtnText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '600'
    },
    nextBtn: {
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 16,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default TutorialModal;
