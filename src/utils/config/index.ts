function GetEnv<T extends string>(key: string, required: true): T;
function GetEnv<T extends string>(key: string, required: false): string | undefined;
function GetEnv<T extends string>(key: string, required: boolean): T | undefined {
  const value = process.env[key] as T | undefined;
  const isClient = typeof window !== 'undefined';
  const isPublic = key.startsWith('NEXT_PUBLIC_');

  if (value) {
    return value;
  }
  if (required && isClient && isPublic) {
    throw new Error(`Environment variable ${key} is required: ${value}`);
  }
  return value as T | undefined;
}

function CheckEnv(key: string, value?: string) {
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

interface ConfigType {
  NODE_ENV: string;
}

const config: ConfigType = {
  NODE_ENV: CheckEnv('NODE_ENV', process.env.NODE_ENV),
};

export const Config = ((): ConfigType => {
  return config;
})();
