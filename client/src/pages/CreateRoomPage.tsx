import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket } from '../lib/socket';
import { useRoomStore, type UserRole } from '../stores/roomStore';
import { Card, CardContent, CardFooter, Button, Input, Select, Typography, LoadingSpinner } from '../components/ui';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { setCurrentRoom, setCurrentUser } = useRoomStore();
  
  const [formData, setFormData] = useState({
    roomName: '',
    userName: '',
    role: '' as UserRole | '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.roomName.trim()) {
      newErrors.roomName = 'Room name is required';
    } else if (formData.roomName.trim().length < 3) {
      newErrors.roomName = 'Room name must be at least 3 characters';
    }

    if (!formData.userName.trim()) {
      newErrors.userName = 'Your name is required';
    } else if (formData.userName.trim().length < 2) {
      newErrors.userName = 'Name must be at least 2 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    if (!socket.connected) {
      setErrors({ submit: 'Not connected to server. Please wait...' });
      socket.connect();
      return;
    }

    setIsSubmitting(true);

    socket.emit(
      'create-room',
      {
        roomName: formData.roomName.trim(),
        userName: formData.userName.trim(),
        role: formData.role,
      },
      (response: { success: boolean; room?: any; error?: string }) => {
        setIsSubmitting(false);
        
        if (response.success && response.room) {
          setCurrentRoom(response.room);
          setCurrentUser({
            id: socket.id!,
            name: formData.userName.trim(),
            role: formData.role as UserRole,
          });
          navigate(`/room/${response.room.id}`);
        } else {
          setErrors({ submit: response.error || 'Failed to create room' });
        }
      }
    );
  };

  const isFormValid = formData.roomName.trim().length >= 3 && 
                      formData.userName.trim().length >= 2 && 
                      formData.role !== '';

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 pt-20 sm:pt-24 pb-12 sm:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Typography variant="h1" className="mb-2 text-3xl sm:text-4xl">
          Create Room
        </Typography>
        <Typography variant="body" className="text-surface-600 dark:text-surface-400">
          Start a new planning poker session for your team.
        </Typography>

        <Card className="mt-8">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <Input
                label="Room Name"
                placeholder="e.g., Sprint 24 Planning"
                value={formData.roomName}
                onChange={(e) => {
                  setFormData({ ...formData, roomName: e.target.value });
                  if (errors.roomName) {
                    setErrors({ ...errors, roomName: '' });
                  }
                }}
                error={errors.roomName}
                helperText="Choose a name that helps identify this session"
                disabled={isSubmitting}
                autoFocus
              />

              <Input
                label="Your Name"
                placeholder="e.g., Alex Chen"
                value={formData.userName}
                onChange={(e) => {
                  setFormData({ ...formData, userName: e.target.value });
                  if (errors.userName) {
                    setErrors({ ...errors, userName: '' });
                  }
                }}
                error={errors.userName}
                helperText="This is how others will see you in the room"
                disabled={isSubmitting}
              />

              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value as UserRole });
                  if (errors.role) {
                    setErrors({ ...errors, role: '' });
                  }
                }}
                error={errors.role}
                helperText="Select your role in this session"
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Select a role...' },
                  { value: 'developer', label: 'Developer' },
                  { value: 'qa', label: 'QA' },
                  { value: 'product-owner', label: 'Product Owner' },
                ]}
              />

              {errors.submit && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isFormValid || isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating...
                  </>
                ) : (
                  'Create Room'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
