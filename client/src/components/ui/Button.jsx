import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', isLoading, children, ...props }, ref) => {
    const variants = {
        primary: 'bg-gradient-to-r from-[#FF9933] to-[#FF671F] hover:from-[#FF8000] hover:to-[#E65100] text-white shadow-lg shadow-orange-500/20 border-none', // Saffron
        secondary: 'bg-[#138808] text-white hover:bg-[#138808]/90 shadow-lg shadow-green-500/20', // Green
        ghost: 'hover:bg-white/10 hover:text-white',
        outline: 'border border-white/20 bg-transparent hover:bg-white/5 text-white',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizes = {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
    };

    return (
        <motion.button
            ref={ref}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </motion.button>
    );
});

Button.displayName = 'Button';

export { Button };
