-- ============================================================================
-- VetCare — Migración multi-tenant (Fase 1c): datos de muestra clínicos
-- Todo el dato demo vive en la BD (nada hardcodeado en el app). Solo clínica a1.
-- ============================================================================

-- IDs referenciados del seed base (20260616030000):
--   clínica a1  = 00000000-0000-0000-0000-0000000000a1
--   clientes    = f101 (María) f102 (Juan) f103 (Carla)
--   mascotas    = b1 (Rocky → f101)  b2 (Luna → f102)
--   veterinarios= f201 (Ana) f202 (Luis)

insert into public.appointments (id, clinic_id, date, time, client_id, pet_id, vet_id, reason, status) values
  ('00000000-0000-0000-0000-00000000f401', '00000000-0000-0000-0000-0000000000a1', current_date + 1, '09:30', '00000000-0000-0000-0000-00000000f101', '00000000-0000-0000-0000-0000000000b1', 'f201', 'Control de peso y revisión general', 'Confirmada'),
  ('00000000-0000-0000-0000-00000000f402', '00000000-0000-0000-0000-0000000000a1', current_date, '10:00', '00000000-0000-0000-0000-00000000f102', '00000000-0000-0000-0000-0000000000b2', 'f202', 'Vacunación anual', 'Pendiente'),
  ('00000000-0000-0000-0000-00000000f403', '00000000-0000-0000-0000-0000000000a1', current_date - 12, '15:00', '00000000-0000-0000-0000-00000000f101', '00000000-0000-0000-0000-0000000000b1', 'f201', 'Consulta por alergia cutánea', 'Finalizada');

insert into public.consultations (id, clinic_id, date, vet_id, pet_id, reason, weight, temperature, diagnosis, treatment, medications, notes, appointment_id) values
  ('00000000-0000-0000-0000-00000000f451', '00000000-0000-0000-0000-0000000000a1', current_date, 'f201', '00000000-0000-0000-0000-0000000000b1', 'Control de peso y revisión general', 28, 38.6, 'Paciente en buen estado general.', 'Control en 6 semanas.', 'Ninguna.', 'Sin hallazgos relevantes.', '00000000-0000-0000-0000-00000000f401'),
  ('00000000-0000-0000-0000-00000000f452', '00000000-0000-0000-0000-0000000000a1', current_date - 12, 'f201', '00000000-0000-0000-0000-0000000000b1', 'Consulta por alergia cutánea', 27, 38.7, 'Dermatitis atópica leve.', 'Baño medicado y dieta hipoalergénica.', 'Oclacitinib 10mg.', 'Mejoría en 10 días.', '00000000-0000-0000-0000-00000000f403');

insert into public.vaccines (id, clinic_id, pet_id, vaccine_name, laboratory, batch_number, application_date, next_due_date, veterinarian, notes) values
  ('00000000-0000-0000-0000-00000000f501', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Rabia', 'Zoetis', 'RB-2025-118', current_date - 60, current_date + 305, 'Dra. Ana Martínez', 'Refuerzo anual.'),
  ('00000000-0000-0000-0000-00000000f502', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Parvovirus', 'MSD', 'PV-552', current_date - 30, current_date + 335, 'Dra. Ana Martínez', '');

insert into public.dewormings (id, clinic_id, pet_id, product_name, active_ingredient, deworming_type, application_date, next_application_date, weight, dose, veterinarian, notes) values
  ('00000000-0000-0000-0000-00000000f551', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Drontal Plus', 'Praziquantel + Pirantel + Febantel', 'Interna', current_date - 45, current_date + 320, 28, '1 tableta', 'Dra. Ana Martínez', 'Tolerancia óptima.');

insert into public.surgeries (id, clinic_id, pet_id, surgery_date, procedure_type, veterinarian, assistant, preoperative_diagnosis, procedure_performed, anesthesia_type, medications, duration_minutes, status, observations, postoperative_recommendations) values
  ('00000000-0000-0000-0000-00000000f601', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', current_date - 90, 'Esterilización', 'Dra. Ana Martínez', 'Aux. Pedro Ríos', 'Paciente sano apto para procedimiento.', 'Ovariohisterectomía estándar.', 'Inhalatoria (Isoflurano)', 'Tramadol, Meloxicam', 55, 'Finalizada', 'Sin complicaciones intraoperatorias.', 'Reposo 10 días, collar isabelino, control en 7 días.');

insert into public.hospitalizations (id, clinic_id, pet_id, admission_date, admission_time, veterinarian, reason, initial_diagnosis, treatment_plan, patient_status, room_number, status, observations) values
  ('00000000-0000-0000-0000-00000000f701', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2', current_date, '08:30', 'Dr. Luis Pérez', 'Vómitos y letargo', 'Gastroenteritis', 'Fluidoterapia y ayuno controlado.', 'Estable', 'H-01', 'Hospitalizado', 'Evolución favorable.');

insert into public.pet_photos (id, clinic_id, pet_id, title, category, photo_url, photo_date, veterinarian, clinical_notes, uploaded_by) values
  ('00000000-0000-0000-0000-00000000f851', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Herida en pata trasera - día 1', 'Heridas', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800', current_date, 'Dra. Ana Martínez', 'Herida superficial.', 'f201');
