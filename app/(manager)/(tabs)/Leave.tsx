import LeaveRequestForm from "@/components/LeaveRequestForm";
import { LeaveRequestHistory } from "@/components/LeaveRequestHistory";
import { View, ScrollView, StyleSheet, Text, Animated, Dimensions, StatusBar, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, useRef } from "react";

// --- Constants ---
const { width, height } = Dimensions.get("window");

// Color Palette - Orange theme with improved contrast and accessibility
const COLORS = {
    primary: '#FF8C00',        // Dark orange
    primaryLight: '#FFA500',   // Brighter orange
    primaryGradientEnd: '#FFB700', // Yellowish orange for header gradient end
    backgroundLight: "#F8FAFC",
    backgroundDark: "#F1F5F9",
    cardBackground: "#FFFFFF",
    textPrimary: "#1E293B",
    textSecondary: "#64748B",
    border: "rgba(0, 0, 0, 0.08)", // Softer border, adjusted for orange theme
    shadowBase: "rgba(0, 0, 0, 0.1)",
    primaryShadow: "rgba(255, 140, 0, 0.2)", // Orange tint for primary section shadow
    accent: "#2563EB", // Keeping a professional blue for accent where needed
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
};

// Improved Shadow Styles
const CARD_SHADOW_STYLE = {
    shadowColor: COLORS.shadowBase,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
};

const HEADER_SHADOW_STYLE = {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
};

// --- Main Component ---
export default function Leave() {
    const [activeSection, setActiveSection] = useState('request'); // Track active section
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current; // Reduced slide distance
    const headerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Staggered entrance animations
        Animated.parallel([
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.stagger(150, [
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    delay: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    delay: 200,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    const handleSectionPress = (section) => {
        setActiveSection(section);
        // Optional: Add haptic feedback
        // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right", "top"]}>
            {/* Status Bar Configuration for better visual integration */}
            {/* On Android, translucent allows the header to go behind the status bar */}
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={true} />

            {/* Improved Header */}
            <Animated.View
                style={[
                    styles.headerContainer,
                    {
                        opacity: headerAnim,
                        transform: [{ translateY: Animated.multiply(headerAnim, -10) }]
                    }
                ]}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryLight, COLORS.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.8 }}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title} accessibilityRole="header">
                                Leave Management
                            </Text>
                            <Text style={styles.subtitle}>
                                Manage your time off requests efficiently
                            </Text>
                        </View>

                        {/* Improved decorative elements */}
                        <View style={styles.decorativeContainer}>
                            <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
                            <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Content Area */}
            <View style={styles.contentWrapper}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled" // Important for form interaction
                    bounces={true}
                    scrollEventThrottle={16}
                >
                    {/* Request Leave Section */}
                    <Animated.View
                        style={[
                            styles.section,
                            styles.primarySection,
                            activeSection === 'request' && styles.activeSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => handleSectionPress('request')}
                            activeOpacity={0.7}
                            style={styles.sectionHeaderTouchable}
                            accessibilityRole="button"
                            accessibilityLabel="Request leave section"
                            accessibilityHint="Tap to focus on leave request form"
                        >
                            <View style={styles.sectionHeader}>
                                <View style={[styles.iconContainer]}>
                                    <View style={[styles.iconBackground, { backgroundColor: COLORS.primary }]}>
                                        <Text style={styles.iconText}>✉️</Text>
                                    </View>
                                </View>
                                <View style={styles.sectionTitleContainer}>
                                    <Text style={styles.sectionTitle}>Request Leave</Text>
                                    <Text style={styles.sectionDescription}>
                                        Submit a new time-off request
                                    </Text>
                                </View>
                                <View style={styles.chevronContainer}>
                                    <Text style={[
                                        styles.chevron,
                                        activeSection === 'request' && styles.chevronActive
                                    ]}>
                                        {activeSection === 'request' ? '▼' : '▶'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Collapsible content */}
                        {activeSection === 'request' && (
                            <View style={styles.formContainer}>
                                <LeaveRequestForm />
                            </View>
                        )}
                    </Animated.View>

                    {/* Leave History Section */}
                    <Animated.View
                        style={[
                            styles.section,
                            styles.secondarySection,
                            activeSection === 'history' && styles.activeSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => handleSectionPress('history')}
                            activeOpacity={0.7}
                            style={styles.sectionHeaderTouchable}
                            accessibilityRole="button"
                            accessibilityLabel="Leave history section"
                            accessibilityHint="Tap to view your leave request history"
                        >
                            <View style={styles.sectionHeader}>
                                <View style={[styles.iconContainer]}>
                                    <View style={[styles.iconBackground, { backgroundColor: COLORS.accent }]}>
                                        <Text style={styles.iconText}>📊</Text>
                                    </View>
                                </View>
                                <View style={styles.sectionTitleContainer}>
                                    <Text style={styles.sectionTitle}>Leave History</Text>
                                    <Text style={styles.sectionDescription}>
                                        View past requests and their status
                                    </Text>
                                </View>
                                <View style={styles.chevronContainer}>
                                    <Text style={[
                                        styles.chevron,
                                        activeSection === 'history' && styles.chevronActive
                                    ]}>
                                        {activeSection === 'history' ? '▼' : '▶'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Collapsible content */}
                        {activeSection === 'history' && (
                            <View style={styles.historyContainer}>
                                <LeaveRequestHistory />
                            </View>
                        )}
                    </Animated.View>

                    {/* Bottom spacing for better scroll experience */}
                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

// --- Improved Stylesheet ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        // The primary color here will fill the background, which is important
        // when the header has translucent status bar or on devices with notches
        backgroundColor: COLORS.primary,
    },

    // Header Styles
    headerContainer: {
        zIndex: 10,
    },
    header: {
        // Adjusted paddingTop to remove the extra gap below safe area context
        paddingTop: Platform.OS === "android" ? 0 : 8, // No padding on Android, let translucent status bar handle it
        paddingBottom: 20, // Adjusted bottom padding
        paddingHorizontal: 20,
        ...HEADER_SHADOW_STYLE,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 72, // Adjusted minHeight
    },
    headerTextContainer: {
        flex: 1,
        paddingRight: 16,
    },
    title: {
        fontSize: Math.min(width * 0.07, 28),
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 4,
        letterSpacing: 0.5,
        lineHeight: Math.min(width * 0.08, 32),
    },
    subtitle: {
        fontSize: Math.min(width * 0.035, 14),
        fontWeight: "500",
        color: "rgba(255, 255, 255, 0.9)",
        letterSpacing: 0.2,
        lineHeight: 18,
    },

    // Improved Decorative Elements
    decorativeContainer: {
        position: "relative",
        width: 60,
        height: 60,
    },
    decorativeCircle: {
        position: "absolute",
        borderRadius: 50,
    },
    decorativeCircle1: {
        width: 40,
        height: 40,
        backgroundColor: "rgba(255, 255, 255, 0.18)", // Adjusted opacity for orange theme
        top: 0,
        right: 0,
    },
    decorativeCircle2: {
        width: 24,
        height: 24,
        backgroundColor: "rgba(255, 255, 255, 0.12)", // Adjusted opacity for orange theme
        bottom: 0,
        left: 0,
    },

    // Content Styles
    contentWrapper: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
    },

    // Section Styles
    section: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        ...CARD_SHADOW_STYLE,
    },
    primarySection: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    secondarySection: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
    },
    activeSection: {
        borderColor: COLORS.primary,
        ...HEADER_SHADOW_STYLE,
        shadowColor: COLORS.primaryShadow,
    },

    // Section Header Styles
    sectionHeaderTouchable: {
        backgroundColor: "transparent",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 72,
    },
    iconContainer: {
        marginRight: 12,
    },
    iconBackground: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        ...CARD_SHADOW_STYLE,
    },
    iconText: {
        fontSize: 20,
    },
    sectionTitleContainer: {
        flex: 1,
        paddingRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 2,
        letterSpacing: 0.1,
    },
    sectionDescription: {
        fontSize: 13,
        fontWeight: "400",
        color: COLORS.textSecondary,
        lineHeight: 16,
    },
    chevronContainer: {
        padding: 4,
    },
    chevron: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
    chevronActive: {
        color: COLORS.primary,
    },

    // Content Container Styles
    formContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: "rgba(248, 250, 252, 0.5)",
    },
    historyContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: "rgba(248, 250, 252, 0.5)",
    },
    bottomSpacing: {
        height: 20,
    },
});
