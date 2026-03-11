import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <motion.input
            initial={{ opacity: 0.9 }}
            whileFocus={{ opacity: 1, scale: 1.01 }}
            type={type}
            className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export { Input };
