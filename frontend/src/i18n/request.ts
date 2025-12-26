/**
 * Request-scoped i18n configuration for Next.js App Router
 * This file loads the appropriate messages for each locale
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // The middleware already validates locales, so we just need to load the messages
  // If locale is not provided, default to the default locale
  const validLocale = (locale && locales.includes(locale as Locale)) ? locale : 'es';

  // Import all message files for the locale
  const [
    common,
    auth,
    nav,
    navigation,
    dashboard,
    transactions,
    accounts,
    categories,
    groups,
    loans,
    investments,
    widgets,
    forms,
    validation,
    errors,
    notifications,
    settings,
    loading,
    sharedExpense,
    createLoan,
    deleteAccount,
    recordPayment,
    filters,
    pagination
  ] = await Promise.all([
    import(`./messages/${validLocale}/common.json`),
    import(`./messages/${validLocale}/auth.json`),
    import(`./messages/${validLocale}/nav.json`),
    import(`./messages/${validLocale}/navigation.json`),
    import(`./messages/${validLocale}/dashboard.json`),
    import(`./messages/${validLocale}/transactions.json`),
    import(`./messages/${validLocale}/accounts.json`),
    import(`./messages/${validLocale}/categories.json`),
    import(`./messages/${validLocale}/groups.json`),
    import(`./messages/${validLocale}/loans.json`),
    import(`./messages/${validLocale}/investments.json`),
    import(`./messages/${validLocale}/widgets.json`),
    import(`./messages/${validLocale}/forms.json`),
    import(`./messages/${validLocale}/validation.json`),
    import(`./messages/${validLocale}/errors.json`),
    import(`./messages/${validLocale}/notifications.json`),
    import(`./messages/${validLocale}/settings.json`),
    import(`./messages/${validLocale}/loading.json`),
    import(`./messages/${validLocale}/sharedExpense.json`),
    import(`./messages/${validLocale}/createLoan.json`),
    import(`./messages/${validLocale}/deleteAccount.json`),
    import(`./messages/${validLocale}/recordPayment.json`),
    import(`./messages/${validLocale}/filters.json`),
    import(`./messages/${validLocale}/pagination.json`)
  ]);

  return {
    locale: validLocale as string,
    messages: {
      common: common.default,
      auth: auth.default,
      nav: nav.default,
      navigation: navigation.default,
      dashboard: dashboard.default,
      transactions: transactions.default,
      accounts: accounts.default,
      categories: categories.default,
      groups: groups.default,
      loans: loans.default,
      investments: investments.default,
      widgets: widgets.default,
      forms: forms.default,
      validation: validation.default,
      errors: errors.default,
      notifications: notifications.default,
      settings: settings.default,
      loading: loading.default,
      sharedExpense: sharedExpense.default,
      createLoan: createLoan.default,
      deleteAccount: deleteAccount.default,
      recordPayment: recordPayment.default,
      filters: filters.default,
      pagination: pagination.default
    }
  };
});
