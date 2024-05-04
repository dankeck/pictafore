import { fetchAccount } from './fetchAccount.js'
import { ACCOUNT_ID, REBLOG_ID } from '../constants.js'

export function fetchStatus (statusesStore, accountsStore, id, callback) {
  statusesStore.get(id).onsuccess = e => {
    const status = e.target.result
    callback(status)
    if (!status) {
      return
    }
    if (status[ACCOUNT_ID]) {
      fetchAccount(accountsStore, status[ACCOUNT_ID], account => {
        status.account = account
      })
    } else {
      status.account = {}
    }
    if (status[REBLOG_ID]) {
      fetchStatus(statusesStore, accountsStore, status[REBLOG_ID], reblog => {
        status.reblog = reblog
      })
    }
  }
}
