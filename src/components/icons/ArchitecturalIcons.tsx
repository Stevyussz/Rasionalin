"use client";

import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  At,
  BookmarkSimple,
  BookOpenText,
  Brain,
  ChatCircleDots,
  Check,
  CheckCircle,
  Compass,
  DeviceMobile,
  DownloadSimple,
  Exam,
  FileText,
  Fire,
  FirstAidKit,
  Flag,
  Image,
  Keyboard,
  Lightbulb,
  LockKey,
  Notebook,
  NotePencil,
  Paperclip,
  PaperPlaneTilt,
  PencilSimpleLine,
  Play,
  Plus,
  PushPin,
  SealCheck,
  ShieldCheck,
  SignOut,
  SquaresFour,
  Sun,
  Target,
  TextAa,
  Timer,
  Trash,
  UploadSimple,
  UserCircle,
  X,
  type IconProps as PhosphorProps,
} from "@phosphor-icons/react";
import React from "react";

type AppIconProps = Omit<PhosphorProps, "weight"> & {
  weight?: PhosphorProps["weight"];
};

function withDefault(props: AppIconProps): PhosphorProps {
  return {
    size: 20,
    weight: props.weight ?? "duotone",
    "aria-hidden": true,
    ...props,
  };
}

export function NodeLockIcon(props: AppIconProps) {
  return <LockKey {...withDefault(props)} />;
}

export function FractureIcon(props: AppIconProps) {
  return <FirstAidKit {...withDefault(props)} />;
}

export function HealedIcon(props: AppIconProps) {
  return <CheckCircle {...withDefault(props)} />;
}

export function ShieldIcon(props: AppIconProps) {
  return <ShieldCheck {...withDefault(props)} />;
}

export function ScratchpadIcon(props: AppIconProps) {
  return <PencilSimpleLine {...withDefault(props)} />;
}

export function FlagIcon(props: AppIconProps) {
  return <Flag {...withDefault(props)} />;
}

export function HintIcon(props: AppIconProps) {
  return <Lightbulb {...withDefault(props)} />;
}

export function VaultIcon(props: AppIconProps) {
  return <Notebook {...withDefault(props)} />;
}

export function TimerIcon(props: AppIconProps) {
  return <Timer {...withDefault(props)} />;
}

export function SunIcon(props: AppIconProps) {
  return <Sun {...withDefault(props)} />;
}

export function WarmPaperIcon(props: AppIconProps) {
  return <FileText {...withDefault(props)} />;
}

export function CheckIcon(props: AppIconProps) {
  return <Check {...withDefault({ weight: "bold", ...props })} />;
}

export function CloseIcon(props: AppIconProps) {
  return <X {...withDefault({ weight: "bold", ...props })} />;
}

export function UploadIcon(props: AppIconProps) {
  return <UploadSimple {...withDefault(props)} />;
}

export function KeyboardIcon(props: AppIconProps) {
  return <Keyboard {...withDefault(props)} />;
}

export function VerifyIcon(props: AppIconProps) {
  return <SealCheck {...withDefault(props)} />;
}

export function CompassIcon(props: AppIconProps) {
  return <Compass {...withDefault(props)} />;
}

export function SimulationIcon(props: AppIconProps) {
  return <Exam {...withDefault(props)} />;
}

export function PlayIcon(props: AppIconProps) {
  return <Play {...withDefault({ weight: "fill", ...props })} />;
}

export function BookOpenIcon(props: AppIconProps) {
  return <BookOpenText {...withDefault(props)} />;
}

export function FlameIcon(props: AppIconProps) {
  return <Fire {...withDefault(props)} />;
}

export function UserIcon(props: AppIconProps) {
  return <UserCircle {...withDefault(props)} />;
}

export function LogoutIcon(props: AppIconProps) {
  return <SignOut {...withDefault(props)} />;
}

export function ArrowRightIcon(props: AppIconProps) {
  return <ArrowRight {...withDefault({ weight: "bold", ...props })} />;
}

export function TargetIcon(props: AppIconProps) {
  return <Target {...withDefault(props)} />;
}

export function TutorChatIcon(props: AppIconProps) {
  return <ChatCircleDots {...withDefault(props)} />;
}

export function BrainIcon(props: AppIconProps) {
  return <Brain {...withDefault(props)} />;
}

export function SendIcon(props: AppIconProps) {
  return <PaperPlaneTilt {...withDefault({ weight: "fill", ...props })} />;
}

export function AttachIcon(props: AppIconProps) {
  return <Paperclip {...withDefault(props)} />;
}

export function ImageIcon(props: AppIconProps) {
  return <Image {...withDefault(props)} />;
}

export function AtTagIcon(props: AppIconProps) {
  return <At {...withDefault({ weight: "bold", ...props })} />;
}

export function MemoryIcon(props: AppIconProps) {
  return <BookmarkSimple {...withDefault(props)} />;
}

export function NoteEditIcon(props: AppIconProps) {
  return <NotePencil {...withDefault(props)} />;
}

export function PinIcon(props: AppIconProps) {
  return <PushPin {...withDefault(props)} />;
}

export function TrashIcon(props: AppIconProps) {
  return <Trash {...withDefault(props)} />;
}

export function PlusIcon(props: AppIconProps) {
  return <Plus {...withDefault({ weight: "bold", ...props })} />;
}

export function ResetIcon(props: AppIconProps) {
  return <ArrowCounterClockwise {...withDefault({ weight: "bold", ...props })} />;
}

export function DownloadIcon(props: AppIconProps) {
  return <DownloadSimple {...withDefault({ weight: "bold", ...props })} />;
}

export function DeviceMobileIcon(props: AppIconProps) {
  return <DeviceMobile {...withDefault(props)} />;
}

export function ArrowLeftIcon(props: AppIconProps) {
  return <ArrowLeft {...withDefault({ weight: "bold", ...props })} />;
}

export function GridNumbersIcon(props: AppIconProps) {
  return <SquaresFour {...withDefault(props)} />;
}

export function TextSizeIcon(props: AppIconProps) {
  return <TextAa {...withDefault({ weight: "bold", ...props })} />;
}
