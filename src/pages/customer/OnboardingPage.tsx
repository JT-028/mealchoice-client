import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Check, HelpCircle, ChevronRight, Loader2, PartyPopper, Sparkles, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

// Import SVG assets
import welcomeSvg from '@/assets/welcome.svg';
import healthSvg from '@/assets/health_preference.svg';
import mealSvg from '@/assets/meal_preferences.svg';
import budgetSvg from '@/assets/budget_considerations.svg';

const steps = [
    { id: 1, title: 'Welcome', icon: welcomeSvg },
    { id: 2, title: 'Health Preferences', icon: healthSvg },
    { id: 3, title: 'Meal Preferences', icon: mealSvg },
    { id: 4, title: 'Budget Considerations', icon: budgetSvg },
];

const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
    'Nut-Free', 'Halal', 'Kosher', 'Low-Sodium', 'Diabetic-Friendly'
];

const mealTypeOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const cuisineOptions = ['Filipino', 'Asian', 'Western', 'Mediterranean', 'Indian', 'Mexican'];

export function OnboardingPage() {
    const navigate = useNavigate();
    const { token, updateUser, user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Redirect if user has already completed onboarding
    useEffect(() => {
        if (user?.hasCompletedOnboarding) {
            navigate('/customer', { replace: true });
        }
    }, [user, navigate]);

    // Auto-redirect after completion
    useEffect(() => {
        if (isCompleted && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (isCompleted && countdown === 0) {
            navigate('/customer');
        }
    }, [isCompleted, countdown, navigate]);

    // Health preferences
    const [health, setHealth] = useState({
        height: '',
        weight: '',
        age: '',
        sex: '',
        activityLevel: '',
        dietaryRestrictions: [] as string[],
    });

    // Meal preferences
    const [meal, setMeal] = useState({
        preferredMealTypes: [] as string[],
        preferredCuisines: [] as string[],
        preferredIngredients: '',
        avoidedIngredients: '',
        calorieMin: 1200,
        calorieMax: 2500,
        maxSodium: 2300,
        maxSugar: 50,
        maxFats: 65,
    });

    // Budget preferences
    const [budget, setBudget] = useState({
        weeklyBudget: '',
        budgetPerMeal: '',
        prefersPriceRange: '',
    });

    const toggleDietaryRestriction = (restriction: string) => {
        setHealth(prev => ({
            ...prev,
            dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
                ? prev.dietaryRestrictions.filter(r => r !== restriction)
                : [...prev.dietaryRestrictions, restriction]
        }));
    };

    const toggleMealType = (type: string) => {
        setMeal(prev => ({
            ...prev,
            preferredMealTypes: prev.preferredMealTypes.includes(type)
                ? prev.preferredMealTypes.filter(t => t !== type)
                : [...prev.preferredMealTypes, type]
        }));
    };

    const toggleCuisine = (cuisine: string) => {
        setMeal(prev => ({
            ...prev,
            preferredCuisines: prev.preferredCuisines.includes(cuisine)
                ? prev.preferredCuisines.filter(c => c !== cuisine)
                : [...prev.preferredCuisines, cuisine]
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/preferences/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    health: {
                        height: health.height ? Number(health.height) : null,
                        weight: health.weight ? Number(health.weight) : null,
                        age: health.age ? Number(health.age) : null,
                        sex: health.sex || null,
                        activityLevel: health.activityLevel || null,
                        dietaryRestrictions: health.dietaryRestrictions,
                    },
                    meal: {
                        preferredMealTypes: meal.preferredMealTypes,
                        preferredCuisines: meal.preferredCuisines,
                        preferredIngredients: meal.preferredIngredients.split(',').map(i => i.trim()).filter(Boolean),
                        avoidedIngredients: meal.avoidedIngredients.split(',').map(i => i.trim()).filter(Boolean),
                        calorieMin: meal.calorieMin,
                        calorieMax: meal.calorieMax,
                        maxSodium: meal.maxSodium,
                        maxSugar: meal.maxSugar,
                        maxFats: meal.maxFats,
                    },
                    budget: {
                        weeklyBudget: budget.weeklyBudget ? Number(budget.weeklyBudget) : null,
                        budgetPerMeal: budget.budgetPerMeal ? Number(budget.budgetPerMeal) : null,
                        prefersPriceRange: budget.prefersPriceRange || null,
                    },
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Update user in context to include hasCompletedOnboarding
                if (updateUser) {
                    updateUser({ hasCompletedOnboarding: true });
                }
                setIsCompleted(true);
            }
        } catch (error) {
            console.error('Failed to save preferences:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validation functions
    const validateHealthStep = () => {
        return (
            health.height !== '' &&
            health.weight !== '' &&
            health.age !== '' &&
            health.sex !== '' &&
            health.activityLevel !== ''
        );
    };

    const validateMealStep = () => {
        return (
            meal.preferredMealTypes.length > 0 &&
            meal.preferredCuisines.length > 0
        );
    };

    const validateBudgetStep = () => {
        return (
            budget.weeklyBudget !== '' ||
            budget.budgetPerMeal !== ''
        );
    };

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
        else handleSubmit();
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // Animation variants
    const pageVariants = {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
            <AnimatePresence mode="wait">
                {isCompleted ? (
                    <motion.div
                        key="completion"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="min-h-screen flex items-center justify-center p-4"
                    >
                        <div className="text-center max-w-md">
                            {/* Animated success icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                className="mx-auto mb-6 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                                >
                                    <PartyPopper className="h-12 w-12 text-primary" />
                                </motion.div>
                            </motion.div>

                            {/* Sparkles decoration */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex justify-center gap-2 mb-4"
                            >
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                <Sparkles className="h-5 w-5 text-primary" />
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                            </motion.div>

                            {/* Title */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-3xl font-bold mb-3"
                            >
                                Congratulations! 🎉
                            </motion.h1>

                            {/* Message */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="text-muted-foreground mb-6"
                            >
                                You've successfully completed the initial setup of MealChoice.
                                Your personalized experience is ready!
                            </motion.p>

                            {/* Redirect notice */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="bg-muted/50 rounded-lg p-4 mb-6"
                            >
                                <p className="text-sm text-muted-foreground">
                                    Redirecting to your dashboard in
                                </p>
                                <motion.span
                                    key={countdown}
                                    initial={{ scale: 1.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-2xl font-bold text-primary"
                                >
                                    {countdown}
                                </motion.span>
                                <p className="text-sm text-muted-foreground">seconds</p>
                            </motion.div>

                            {/* Skip button */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/customer')}
                                    className="gap-2"
                                >
                                    Go to Dashboard Now
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </motion.div>

                            {/* Loading dots */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="flex justify-center gap-1 mt-6"
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            y: [0, -6, 0],
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                        }}
                                        className="w-2 h-2 rounded-full bg-primary/40"
                                    />
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="onboarding"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Progress Steps */}
                        <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
                            <div className="max-w-3xl mx-auto px-4 py-4">
                                <div className="relative flex items-start justify-between">
                                    {/* Connecting Line - behind the nodes */}
                                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" style={{ marginLeft: '40px', marginRight: '40px' }} />
                                    <div
                                        className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300"
                                        style={{
                                            marginLeft: '40px',
                                            width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 80px * ${(currentStep - 1) / (steps.length - 1)})`
                                        }}
                                    />

                                    {steps.map((step) => (
                                        <div key={step.id} className="flex flex-col items-center z-10">
                                            <motion.div
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: currentStep >= step.id ? 1 : 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-background border-2 transition-all duration-200 ${currentStep > step.id
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : currentStep === step.id
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-muted-foreground/30 text-muted-foreground'
                                                    }`}
                                            >
                                                {currentStep > step.id ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    step.id
                                                )}
                                            </motion.div>
                                            <span className={`text-[10px] sm:text-xs mt-2 font-medium text-center max-w-[80px] leading-tight ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                                                }`}>
                                                {step.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-w-6xl mx-auto px-4 py-8">
                            <AnimatePresence mode="wait">
                                {currentStep === 1 && (
                                    <motion.div
                                        key="welcome"
                                        variants={pageVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 min-h-[60vh]"
                                    >
                                        <motion.div
                                            className="flex-shrink-0 w-full max-w-xs lg:max-w-sm"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <img src={welcomeSvg} alt="Welcome" className="w-full" />
                                        </motion.div>
                                        <div className="flex-1 text-center lg:text-left">
                                            <motion.h1
                                                className="text-4xl font-bold mb-4"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                Welcome to MealChoice!
                                            </motion.h1>
                                            <motion.p
                                                className="text-lg text-muted-foreground mb-8"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                MealChoice is a platform designed to help you manage your meals efficiently.
                                                Let's get started by providing some information to personalize your experience.
                                            </motion.p>

                                            {/* Navigation Buttons */}
                                            <div className="flex justify-between items-center mt-8">
                                                <Button
                                                    variant="outline"
                                                    onClick={prevStep}
                                                    disabled={currentStep === 1}
                                                >
                                                    Previous
                                                </Button>
                                                <Button onClick={nextStep} className="gap-2">
                                                    Get Started
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 2 && (
                                    <motion.div
                                        key="health"
                                        variants={pageVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16"
                                    >
                                        <motion.div
                                            className="flex-1 max-w-sm mx-auto lg:mx-0"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <img src={healthSvg} alt="Health Preferences" className="w-full" />
                                        </motion.div>
                                        <div className="flex-1 w-full">
                                            <h2 className="text-3xl font-bold mb-2">Health Preferences</h2>
                                            <p className="text-muted-foreground mb-6">
                                                Tell us about your health preferences to tailor your meal plans.
                                            </p>
                                            <Card>
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="height">Height (cm)</Label>
                                                            <Input
                                                                id="height"
                                                                type="number"
                                                                min={1}
                                                                placeholder="170"
                                                                value={health.height}
                                                                onChange={(e) => setHealth({ ...health, height: Math.max(0, Number(e.target.value)).toString() })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="weight">Weight (kg)</Label>
                                                            <Input
                                                                id="weight"
                                                                type="number"
                                                                min={1}
                                                                placeholder="65"
                                                                value={health.weight}
                                                                onChange={(e) => setHealth({ ...health, weight: Math.max(0, Number(e.target.value)).toString() })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="age">Age</Label>
                                                            <Input
                                                                id="age"
                                                                type="number"
                                                                min={1}
                                                                placeholder="25"
                                                                value={health.age}
                                                                onChange={(e) => setHealth({ ...health, age: Math.max(0, Number(e.target.value)).toString() })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Sex</Label>
                                                            <Select value={health.sex} onValueChange={(v) => setHealth({ ...health, sex: v })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select sex" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="male">Male</SelectItem>
                                                                    <SelectItem value="female">Female</SelectItem>
                                                                    <SelectItem value="other">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Activity Level</Label>
                                                            <Select value={health.activityLevel} onValueChange={(v) => setHealth({ ...health, activityLevel: v })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select activity level" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="sedentary">Sedentary</SelectItem>
                                                                    <SelectItem value="light">Lightly Active</SelectItem>
                                                                    <SelectItem value="moderate">Moderately Active</SelectItem>
                                                                    <SelectItem value="active">Active</SelectItem>
                                                                    <SelectItem value="very_active">Very Active</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Dietary Restrictions</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {dietaryOptions.map(option => (
                                                                <Badge
                                                                    key={option}
                                                                    variant={health.dietaryRestrictions.includes(option) ? 'default' : 'outline'}
                                                                    className="cursor-pointer transition-all hover:scale-105"
                                                                    onClick={() => toggleDietaryRestriction(option)}
                                                                >
                                                                    {option}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Navigation Buttons */}
                                            <div className="space-y-3 mt-6">
                                                {!validateHealthStep() && (
                                                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                        <span>Please fill in all health fields. Dietary restrictions are optional.</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <Button variant="outline" onClick={prevStep}>
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        onClick={nextStep}
                                                        className="gap-2"
                                                        disabled={!validateHealthStep()}
                                                    >
                                                        Next Step
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 3 && (
                                    <motion.div
                                        key="meal"
                                        variants={pageVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col lg:flex-row items-start gap-6 lg:gap-12"
                                    >
                                        <motion.div
                                            className="flex-shrink-0 w-full max-w-[480px] mx-auto lg:mx-0"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <img src={mealSvg} alt="Meal Preferences" className="w-full" />
                                        </motion.div>
                                        <div className="flex-1 w-full">
                                            <h2 className="text-2xl font-bold mb-2">Meal Preferences</h2>
                                            <p className="text-muted-foreground mb-4 text-sm">
                                                Share your meal preferences to help us create personalized meal plans for you.
                                            </p>
                                            <Card className="border-dashed">
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Preferred Meal Types</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {mealTypeOptions.map(type => (
                                                                <Badge
                                                                    key={type}
                                                                    variant={meal.preferredMealTypes.includes(type) ? 'default' : 'outline'}
                                                                    className="cursor-pointer transition-all hover:scale-105"
                                                                    onClick={() => toggleMealType(type)}
                                                                >
                                                                    {type}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Preferred Cuisines</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {cuisineOptions.map(cuisine => (
                                                                <Badge
                                                                    key={cuisine}
                                                                    variant={meal.preferredCuisines.includes(cuisine) ? 'default' : 'outline'}
                                                                    className="cursor-pointer transition-all hover:scale-105"
                                                                    onClick={() => toggleCuisine(cuisine)}
                                                                >
                                                                    {cuisine}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="preferredIngredients">Preferred Ingredients</Label>
                                                            <Input
                                                                id="preferredIngredients"
                                                                placeholder="chicken, rice, vegetables..."
                                                                value={meal.preferredIngredients}
                                                                onChange={(e) => setMeal({ ...meal, preferredIngredients: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="avoidedIngredients">Avoided Ingredients</Label>
                                                            <Input
                                                                id="avoidedIngredients"
                                                                placeholder="peanuts, shellfish..."
                                                                value={meal.avoidedIngredients}
                                                                onChange={(e) => setMeal({ ...meal, avoidedIngredients: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <TooltipProvider>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Label htmlFor="calorieMin">Calorie Range (Min)</Label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Minimum recommended: 1,200 calories/day</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <Input
                                                                    id="calorieMin"
                                                                    type="number"
                                                                    min={0}
                                                                    value={meal.calorieMin}
                                                                    onChange={(e) => setMeal({ ...meal, calorieMin: Math.max(0, Number(e.target.value)) })}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Label htmlFor="calorieMax">Calorie Range (Max)</Label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Maximum recommended: 2,500 calories/day</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <Input
                                                                    id="calorieMax"
                                                                    type="number"
                                                                    min={0}
                                                                    value={meal.calorieMax}
                                                                    onChange={(e) => setMeal({ ...meal, calorieMax: Math.max(0, Number(e.target.value)) })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Label htmlFor="maxSodium">Max Sodium (mg)</Label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Recommended daily limit: 2,300mg</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <Input
                                                                    id="maxSodium"
                                                                    type="number"
                                                                    min={0}
                                                                    value={meal.maxSodium}
                                                                    onChange={(e) => setMeal({ ...meal, maxSodium: Math.max(0, Number(e.target.value)) })}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Label htmlFor="maxSugar">Max Sugar (g)</Label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Recommended daily limit: 50g</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <Input
                                                                    id="maxSugar"
                                                                    type="number"
                                                                    min={0}
                                                                    value={meal.maxSugar}
                                                                    onChange={(e) => setMeal({ ...meal, maxSugar: Math.max(0, Number(e.target.value)) })}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Label htmlFor="maxFats">Max Fats (g)</Label>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Recommended daily limit: 65g</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                <Input
                                                                    id="maxFats"
                                                                    type="number"
                                                                    min={0}
                                                                    value={meal.maxFats}
                                                                    onChange={(e) => setMeal({ ...meal, maxFats: Math.max(0, Number(e.target.value)) })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </TooltipProvider>
                                                </CardContent>
                                            </Card>

                                            {/* Navigation Buttons */}
                                            <div className="space-y-3 mt-6">
                                                {!validateMealStep() && (
                                                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                        <span>Please select at least one meal type and one cuisine preference.</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <Button variant="outline" onClick={prevStep}>
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        onClick={nextStep}
                                                        className="gap-2"
                                                        disabled={!validateMealStep()}
                                                    >
                                                        Next Step
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 4 && (
                                    <motion.div
                                        key="budget"
                                        variants={pageVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16"
                                    >
                                        <motion.div
                                            className="flex-1 max-w-sm mx-auto lg:mx-0"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <img src={budgetSvg} alt="Budget Considerations" className="w-full" />
                                        </motion.div>
                                        <div className="flex-1 w-full">
                                            <h2 className="text-3xl font-bold mb-2">Budget Considerations</h2>
                                            <p className="text-muted-foreground mb-6">
                                                Set your budget preferences to help us recommend meals within your spending range.
                                            </p>
                                            <Card>
                                                <CardContent className="p-6 space-y-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="weeklyBudget">Weekly Food Budget (₱)</Label>
                                                            <Input
                                                                id="weeklyBudget"
                                                                type="number"
                                                                min={0}
                                                                placeholder="2000"
                                                                value={budget.weeklyBudget}
                                                                onChange={(e) => setBudget({ ...budget, weeklyBudget: Math.max(0, Number(e.target.value)).toString() })}
                                                            />
                                                            <p className="text-xs text-muted-foreground">
                                                                How much do you plan to spend on food each week?
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="budgetPerMeal">Budget Per Meal (₱)</Label>
                                                            <Input
                                                                id="budgetPerMeal"
                                                                type="number"
                                                                min={0}
                                                                placeholder="100"
                                                                value={budget.budgetPerMeal}
                                                                onChange={(e) => setBudget({ ...budget, budgetPerMeal: Math.max(0, Number(e.target.value)).toString() })}
                                                            />
                                                            <p className="text-xs text-muted-foreground">
                                                                Average amount you'd like to spend per meal.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label>Preferred Price Range</Label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { value: 'budget', label: 'Budget', desc: 'Affordable options' },
                                                                { value: 'moderate', label: 'Moderate', desc: 'Balanced value' },
                                                                { value: 'premium', label: 'Premium', desc: 'Quality first' },
                                                            ].map(option => (
                                                                <motion.button
                                                                    key={option.value}
                                                                    type="button"
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => setBudget({ ...budget, prefersPriceRange: option.value })}
                                                                    className={`p-4 rounded-lg border-2 text-left transition-all ${budget.prefersPriceRange === option.value
                                                                        ? 'border-primary bg-primary/5'
                                                                        : 'border-border hover:border-primary/50'
                                                                        }`}
                                                                >
                                                                    <div className="font-medium">{option.label}</div>
                                                                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Navigation Buttons */}
                                            <div className="space-y-3 mt-6">
                                                {!validateBudgetStep() && (
                                                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                        <span>Please enter either a weekly budget or per-meal budget.</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <Button variant="outline" onClick={prevStep}>
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        onClick={nextStep}
                                                        disabled={isSubmitting || !validateBudgetStep()}
                                                        className="gap-2"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Complete Setup
                                                                <Check className="h-4 w-4" />
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
