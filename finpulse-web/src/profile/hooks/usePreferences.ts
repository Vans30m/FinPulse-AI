import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import toast from 'react-hot-toast';

export function usePreferences() {
  const queryClient = useQueryClient();
  
  const updatePreferences = useMutation({
    mutationFn: profileService.updatePreferences,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(data.message || 'Preferences updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update preferences');
    }
  });

  return {
    updatePreferences
  };
}
