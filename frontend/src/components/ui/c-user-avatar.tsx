import md5 from "md5";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarProps } from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils";

/** Get initials from a name */
export const getInitials = (name: string) => {
	const parts = name.split(" ");
	if (parts.length >= 3) {
		// Get first and last initials for 3+ names
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	}
	// Original behavior for 1-2 names
	return parts
		.map((part) => part.charAt(0))
		.join("")
		.toUpperCase();
};

/** Get a random color from a string */
export const getRandomColor = (str: string) => {
	// Generate a hash from the string to get consistent colors for the same name
	const hash = str.split('').reduce((acc, char) => {
		return char.charCodeAt(0) + ((acc << 5) - acc);
	}, 0);

	const colors = [
		'bg-pink-500/60',
		'bg-green-500/60',
		'bg-blue-500/60',
		'bg-yellow-500/60',
		'bg-purple-500/60',
		'bg-red-500/60',
		'bg-teal-500/60',
		'bg-fuchsia-500/60',
	];

	// Use the hash to pick a color
	const index = Math.abs(hash) % colors.length;

	return colors[index];
};

interface UserAvatarProps extends AvatarProps {
	email: string;
	name: string;
	size: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
	sm: "w-6 h-6",
	md: "w-8 h-8",
	lg: "w-10 h-10",
};

const avatarFallbackSizeClasses = {
	sm: "text-2xs",
	md: "text-sm",
	lg: "text-base",
};

const UserAvatar: React.FC<UserAvatarProps> = ({ email, name, size, ...rest }: UserAvatarProps) => {
  return (
    <Avatar {...rest} className={cn(sizeClasses[size], rest.className)}>
      <AvatarImage
        src={`https://www.gravatar.com/avatar/${md5(email || "").toLowerCase()}?d=404`}
      />
      <AvatarFallback
        className={cn(
          getRandomColor(name),
        )}
      >
        <p className={cn(avatarFallbackSizeClasses[size])}>
          {getInitials(name)}
        </p>
      </AvatarFallback>
    </Avatar>
  )
}

export default UserAvatar;
