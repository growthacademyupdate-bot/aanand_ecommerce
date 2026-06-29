import { Calendar, Clock } from 'lucide-react';

interface PrebookingBadgeProps {
  deliveryDays: number;
  message?: string;
  className?: string;
}

const PrebookingBadge = ({ deliveryDays, message, className = '' }: PrebookingBadgeProps) => {
  return (
    <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1.5 rounded-full text-xs font-medium ${className}`}>
      <Calendar className="h-3.5 w-3.5" />
      <span>Pre-booking</span>
    </div>
  );
};

export default PrebookingBadge;
