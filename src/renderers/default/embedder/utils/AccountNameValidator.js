/**
 * Based on: https://raw.githubusercontent.com/steemit/condenser/master/src/app/utils/ChainValidation.js
 */

const validateAccountName = (value) => {
  let i
  let label
  let len

  if (!value) {
    return 'wrong'
  }
  const length = value.length
  if (length < 3) {
    return 'wrong'
  }
  if (length > 16) {
    return 'wrong'
  }
  const ref = value.split('.')
  for (i = 0, len = ref.length; i < len; i++) {
    label = ref[i]
    if (!/^[a-z]/.test(label)) {
      return 'wrong'
      // each_account_segment_should_start_with_a_letter
    }
    if (!/^[a-z0-9-]*$/.test(label)) {
      return 'wrong'
      // each_account_segment_should_have_only_letters_digits_or_dashes
    }
    if (/--/.test(label)) {
      return 'wrong'
      // each_account_segment_should_have_only_one_dash_in_a_row
    }
    if (!/[a-z0-9]$/.test(label)) {
      return 'wrong'
      // each_account_segment_should_end_with_a_letter_or_digit
    }
    if (!(label.length >= 3)) {
      return 'wrong'
      // each_account_segment_should_be_longer
    }
  }
  return null
}

module.exports = validateAccountName
