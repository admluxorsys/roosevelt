"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X, Send, User, Mail, Globe, Book, Plane, FileQuestion } from "lucide-react";

// Lista ampliada de países
const countries = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba",
  "República Dominicana", "Ecuador", "El Salvador", "Guatemala", "Honduras",
  "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", "Uruguay",
  "Venezuela", "España", "Estados Unidos", "Portugal", "Haití", "Jamaica",
  "Trinidad y Tobago", "Canadá", "Francia", "Italia", "Alemania", "Reino Unido",
  "China", "Japón", "Corea del Sur", "India", "Australia", "Otro"
].sort();

// Lista ampliada de idiomas
const languages = [
  "Español", "Inglés", "Portugués", "Francés", "Alemán", "Italiano",
  "Chino", "Japonés", "Coreano", "Árabe", "Hindi", "Otro"
].sort();

const formSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio").max(100),
  lastName: z.string().min(1, "El apellido es obligatorio").max(100),
  email: z.string().email("Correo electrónico inválido").max(255),
  phone: z.string().min(6, "Número de teléfono inválido").max(50),
  language: z.string().min(1, "Por favor selecciona un idioma"),
  countryOfResidence: z.string().min(1, "Por favor selecciona tu país de residencia"),
  nationality: z.string().min(1, "Por favor selecciona tu nacionalidad"),
  hasPassport: z.string().min(1, "Por favor indica si tienes pasaporte"),
  visaType: z.string().min(1, "Por favor selecciona el tipo de visa"),
});

interface PreApplicationFormProps {
  onClose: () => void;
}

const PreApplicationForm = ({ onClose }: PreApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      language: "",
      countryOfResidence: "",
      nationality: "",
      hasPassport: "",
      visaType: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      console.log("Form submitted:", values);
      toast.success("¡Aplicación enviada exitosamente! Te contactaremos pronto.", {
        duration: 5000,
        position: 'top-center'
      });
      form.reset();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      toast.error("Hubo un error al enviar la aplicación. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-w-3xl w-full my-8 relative border border-gray-100 dark:border-gray-800">

        {/* Header con gradiente sutil */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-t-2xl" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-medium text-gray-900 dark:text-white mb-2">
              Comienza tu Aventura
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Completa este breve formulario y da el primer paso hacia tu sueño americano. ¡Estamos aquí para ayudarte!
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <div className="grid md:grid-cols-2 gap-6">
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <User className="w-4 h-4" /> Nombre
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Juan" className="bg-gray-50 border-gray-200 focus:bg-white transition-all" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Apellido */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <User className="w-4 h-4" /> Apellido
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Pérez" className="bg-gray-50 border-gray-200 focus:bg-white transition-all" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Mail className="w-4 h-4" /> Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan.perez@ejemplo.com" className="bg-gray-50 border-gray-200 focus:bg-white transition-all" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Teléfono con selector de país */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Send className="w-4 h-4 rotate-45" /> kamban / Teléfono
                      </FormLabel>
                      <FormControl>
                        <PhoneInput
                          country={'us'}
                          value={value}
                          onChange={onChange}
                          inputClass="!w-full !h-10 !text-base !bg-gray-50 !border-gray-200 !rounded-md focus:!bg-white focus:!border-primary !transition-all"
                          containerClass="!w-full"
                          buttonClass="!bg-gray-100 !border-gray-200 !rounded-l-md hover:!bg-gray-200"
                          dropdownClass="!shadow-lg !rounded-md"
                          enableSearch={true}
                          searchPlaceholder="Buscar país..."
                          preferredCountries={['us', 'mx', 'co', 've', 'ar', 'cl', 'pe', 'es']}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Idioma */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Book className="w-4 h-4" /> Idioma preferido
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                            <SelectValue placeholder="Selecciona un idioma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px]">
                          {languages.map((lang) => (
                            <SelectItem key={lang} value={lang}>
                              {lang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* País de Residencia */}
                <FormField
                  control={form.control}
                  name="countryOfResidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Globe className="w-4 h-4" /> País de Residencia
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                            <SelectValue placeholder="Selecciona tu país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px]">
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Nacionalidad */}
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Globe className="w-4 h-4" /> Nacionalidad
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                            <SelectValue placeholder="Selecciona tu nacionalidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px]">
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pasaporte */}
                <FormField
                  control={form.control}
                  name="hasPassport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Plane className="w-4 h-4" /> ¿Tienes pasaporte válido?
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Sí, tengo pasaporte vigente</SelectItem>
                          <SelectItem value="no">No, aún no tengo</SelectItem>
                          <SelectItem value="process">Está en trámite</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipo de Visa (Campo Nuevo) */}
              <div className="grid md:grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="visaType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <FileQuestion className="w-4 h-4" /> ¿A qué tipo de visa deseas aplicar?
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                            <SelectValue placeholder="Selecciona el tipo de visa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tourist">Visa de Turista (B1/B2)</SelectItem>
                          <SelectItem value="student">Visa de Estudiante (F1/M1)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12 text-base border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    "Enviar Aplicación"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default PreApplicationForm;

