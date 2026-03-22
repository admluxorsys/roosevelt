'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Flag, MapPin, Users, Briefcase, GraduationCap, FileText, Lock, FolderOpen } from 'lucide-react';

import { TabStudentInfo } from './tabs/TabStudentInfo';
import { TabPassport } from './tabs/TabPassport';
import { TabAddress } from './tabs/TabAddress';
import { TabFamily } from './tabs/TabFamily';
import { TabEmployment } from './tabs/TabEmployment';
import { TabEducation } from './tabs/TabEducation';
import { TabBackground } from './tabs/TabBackground';
import { TabFiles } from './tabs/TabFiles';
import { TabDynamicOther } from './tabs/TabDynamicOther';
import { HelpCircle } from 'lucide-react';

interface ContactFormProps {
    contact: any;
    onChange: (updates: any) => void;
    isEditing?: boolean;
}

export const EnhancedContactForm: React.FC<ContactFormProps> = ({ contact, onChange, isEditing = false }) => {
    const updateField = (field: string, value: any) => {
        onChange({ ...contact, [field]: value });
    };

    return (
        <Tabs defaultValue="student" className="w-full h-full flex flex-col">
            <div className="shrink-0 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                <TabsList className="bg-neutral-900/50 p-1 rounded-xl inline-flex h-auto w-auto min-w-full justify-start gap-1">
                    <TabsTrigger value="student" className="data-[state=active]:bg-blue-600 rounded-lg px-4 py-2 text-xs">
                        <User className="w-3.5 h-3.5 mr-2" />
                        Estudiante
                    </TabsTrigger>
                    <TabsTrigger value="passport" className="data-[state=active]:bg-blue-600 rounded-lg px-4 py-2 text-xs">
                        <Flag className="w-3.5 h-3.5 mr-2" />
                        Pasaporte
                    </TabsTrigger>
                    <TabsTrigger value="address" className="data-[state=active]:bg-blue-600 rounded-lg px-4 py-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 mr-2" />
                        Dirección
                    </TabsTrigger>
                    <TabsTrigger value="family" className="data-[state=active]:bg-blue-600 rounded-lg px-4 py-2 text-xs">
                        <Users className="w-3.5 h-3.5 mr-2" />
                        Familia
                    </TabsTrigger>
                    <TabsTrigger value="employment" className="data-[state=active]:bg-blue-600 rounded-lg px-4 py-2 text-xs">
                        <Briefcase className="w-3.5 h-3.5 mr-2" />
                        Empleo
                    </TabsTrigger>
                    <TabsTrigger value="education" className="data-[state=active]:bg-blue-600 rounded-lg px-4 py-2 text-xs">
                        <GraduationCap className="w-3.5 h-3.5 mr-2" />
                        Estudios
                    </TabsTrigger>
                    <TabsTrigger value="background" className="data-[state=active]:bg-blue-600 rounded-lg px-4 py-2 text-xs">
                        <Lock className="w-3.5 h-3.5 mr-2" />
                        Antecedentes
                    </TabsTrigger>
                    <TabsTrigger value="files" className="data-[state=active]:bg-blue-600 rounded-lg px-4 py-2 text-xs">
                        <FolderOpen className="w-3.5 h-3.5 mr-2" />
                        Archivos
                    </TabsTrigger>
                    {contact.extraData && Object.keys(contact.extraData).length > 0 && (
                        <TabsTrigger value="others" className="data-[state=active]:bg-amber-600 rounded-lg px-4 py-2 text-xs">
                            <HelpCircle className="w-3.5 h-3.5 mr-2" />
                            Otros
                        </TabsTrigger>
                    )}
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <TabsContent value="student" className="mt-0"><TabStudentInfo contact={contact} updateField={updateField} isEditing={isEditing} /></TabsContent>
                <TabsContent value="passport" className="mt-0"><TabPassport contact={contact} updateField={updateField} isEditing={isEditing} /></TabsContent>
                <TabsContent value="address" className="mt-0"><TabAddress contact={contact} updateField={updateField} isEditing={isEditing} /></TabsContent>
                <TabsContent value="family" className="mt-0"><TabFamily contact={contact} updateField={updateField} isEditing={isEditing} /></TabsContent>
                <TabsContent value="employment" className="mt-0"><TabEmployment contact={contact} updateField={updateField} isEditing={isEditing} /></TabsContent>
                <TabsContent value="education" className="mt-0"><TabEducation contact={contact} updateField={updateField} isEditing={isEditing} /></TabsContent>
                <TabsContent value="background" className="mt-0"><TabBackground contact={contact} updateField={updateField} isEditing={isEditing} /></TabsContent>
                <TabsContent value="files" className="mt-0"><TabFiles contact={contact} updateField={updateField} isEditing={isEditing} /></TabsContent>
                {contact.extraData && Object.keys(contact.extraData).length > 0 && (
                    <TabsContent value="others" className="mt-0">
                        <TabDynamicOther contact={contact} updateField={updateField} isEditing={isEditing} />
                    </TabsContent>
                )}
            </div>
        </Tabs>
    );
};

