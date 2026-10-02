import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserMinus, Users } from 'lucide-react';
import { api, errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button, EmptyState, SectionCard } from '../../components/ui';

export default function PeopleTab({ classroom, reloadClass }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const remove = async (student) => {
    const self = student._id === user._id;
    if (!window.confirm(self ? `Leave "${classroom.title}"?` : `Remove ${student.name} from this class?`)) return;
    try {
      await api.delete(`/classes/${classroom._id}/students/${student._id}`);
      if (self) {
        toast.success('You left the class');
        navigate('/classes');
      } else {
        toast.success(`${student.name} removed`);
        reloadClass();
      }
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard title="Tutor">
        <div className="flex items-center gap-3">
          <Avatar user={classroom.tutor} size="lg" />
          <div>
            <p className="font-semibold">{classroom.tutor.name}</p>
            <p className="text-sm text-slate-500">{classroom.tutor.email}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={`Students (${classroom.students.length})`} className="lg:col-span-2">
        {classroom.students.length ? (
          <ul className="divide-y divide-slate-100">
            {classroom.students.map((s) => (
              <li key={s._id} className="flex items-center gap-3 py-3">
                <Avatar user={s} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}{s._id === user._id && ' (you)'}</p>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </div>
                {classroom.isTutor && (
                  <Button size="sm" variant="ghost" icon={UserMinus} onClick={() => remove(s)}>Remove</Button>
                )}
                {!classroom.isTutor && s._id === user._id && (
                  <Button size="sm" variant="ghost" onClick={() => remove(s)}>Leave class</Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Users} title="No students yet" text={`Share the class code ${classroom.code ?? ''} with your students.`} />
        )}
      </SectionCard>
    </div>
  );
}
