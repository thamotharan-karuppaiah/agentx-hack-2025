// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from 'react-beautiful-dnd';
import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus } from 'lucide-react';
import { Group as GroupType, FieldSchema } from './types';
import { FieldConfigForm } from './components/FieldConfigForm';
import { Group } from './components/Group';
import { NodeConfig } from '@/features/Workflow/types';

interface InputConfigProps extends NodeConfig {
    data: NodeConfig;
    onChange: (data: Partial<NodeConfig>) => void;
}

export function InputConfig({ onChange, data }: InputConfigProps) {
    const [groups, setGroups] = useState<GroupType[]>(data.groups || []);
    const [showFieldConfig, setShowFieldConfig] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<FieldSchema | undefined>(undefined);

    const updateGroups = useCallback((newGroups: GroupType[]) => {
        setGroups(newGroups);
        onChange({ groups: newGroups });
    }, [onChange]);

    useEffect(() => {
        if (!data.groups?.length) {
            const defaultGroup: GroupType = {
                id: `group-${Date.now()}`,
                name: '',
                fields: []
            };
            updateGroups([defaultGroup]);
        }
    }, [data.groups, updateGroups]);

    const addGroup = useCallback(() => {
        const newGroup: GroupType = {
            id: `group-${Date.now()}`,
            name: '',
            fields: []
        };
        updateGroups([...groups, newGroup]);
    }, [groups, updateGroups]);

    const addField = useCallback((groupId: string) => {
        const newField: FieldSchema = {
            id: `field-${Date.now()}`,
            type: 'short_text',
            label: '',
            variableName: '',
            hint: '',
            placeholder: '',
            required: false
        };

        const newGroups = groups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    fields: [...group.fields, newField]
                };
            }
            return group;
        });
        
        updateGroups(newGroups);
        setSelectedGroup(groupId);
        setEditingField(newField);
        setShowFieldConfig(true);
    }, [groups, updateGroups]);

    const handleFieldSave = useCallback((groupId: string, field: FieldSchema) => {
        const newGroups = groups.map(group => {
            if (group.id === groupId) {
                if (editingField) {
                    return {
                        ...group,
                        fields: group.fields.map(f => f.id === editingField.id ? field : f)
                    };
                }
                return {
                    ...group,
                    fields: [...group.fields, field]
                };
            }
            return group;
        });
        
        updateGroups(newGroups);
    }, [groups, editingField, updateGroups]);

    const handleBackClick = useCallback(() => {
        setShowFieldConfig(false);
        setEditingField(undefined);
    }, []);

    const deleteGroup = useCallback((groupId: string) => {
        const newGroups = groups.filter(group => group.id !== groupId);
        updateGroups(newGroups);
    }, [groups, updateGroups]);

    const deleteField = useCallback((groupId: string, fieldId: string) => {
        const newGroups = groups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    fields: group.fields.filter(field => field.id !== fieldId)
                };
            }
            return group;
        });
        updateGroups(newGroups);
    }, [groups, updateGroups]);

    const onDragEnd = useCallback((result: DropResult) => {
        const { source, destination, type } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        if (type === 'group') {
            const newGroups = Array.from(groups);
            const [removed] = newGroups.splice(source.index, 1);
            newGroups.splice(destination.index, 0, removed);
            updateGroups(newGroups);
            return;
        }

        if (type === 'field') {
            const newGroups = Array.from(groups);
            const sourceGroup = newGroups.find(g => g.id === source.droppableId);
            const destGroup = newGroups.find(g => g.id === destination.droppableId);

            if (!sourceGroup || !destGroup) return;

            const [movedField] = sourceGroup.fields.splice(source.index, 1);

            if (source.droppableId === destination.droppableId) {
                sourceGroup.fields.splice(destination.index, 0, movedField);
            } else {
                destGroup.fields.splice(destination.index, 0, movedField);
            }

            updateGroups(newGroups);
        }
    }, [groups, updateGroups]);

    const editField = useCallback((groupId: string, field: FieldSchema) => {
        setSelectedGroup(groupId);
        setEditingField(field);
        setShowFieldConfig(true);
    }, []);

    const handleGroupNameChange = useCallback((groupId: string, name: string) => {
        const newGroups = groups.map(group =>
            group.id === groupId ? { ...group, name } : group
        );
        updateGroups(newGroups);
    }, [groups, updateGroups]);

    if (showFieldConfig) {
        return (
            <div className="space-y-4">
                <button
                    onClick={handleBackClick}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>
                <FieldConfigForm
                    onSave={(field) => handleFieldSave(selectedGroup!, field)}
                    initialField={editingField}
                />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="groups" type="group">
                    {(provided: DroppableProvided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {groups.map((group, index) => (
                                <Draggable key={group.id} draggableId={group.id} index={index}>
                                    {(provided: DraggableProvided) => (
                                        <Droppable droppableId={group.id} type="field">
                                            {(dropProvided: DroppableProvided) => (
                                                <Group
                                                    group={group}
                                                    index={index}
                                                    provided={provided}
                                                    dropProvided={dropProvided}
                                                    onAddField={() => addField(group.id)}
                                                    onDeleteGroup={() => deleteGroup(group.id)}
                                                    onEditField={(field) => editField(group.id, field)}
                                                    onDeleteField={(fieldId) => deleteField(group.id, fieldId)}
                                                    onGroupNameChange={(name) => handleGroupNameChange(group.id, name)}
                                                />
                                            )}
                                        </Droppable>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            <Button
                onClick={addGroup}
                variant="ghost"
                className="w-full h-11 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg"
            >
                Add group
                <Plus className="w-4 h-4 ml-1" />
            </Button>
        </div>
    );
}